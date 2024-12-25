use reqwest::Client;
use scraper::{Html, Selector};
use std::collections::HashMap;


async fn jwxt_auth(account: &str, password: &str) -> Result<Client, Box<dyn std::error::Error>> {

    let client = Client::builder()
        .cookie_store(true)
        .build()
        ?;

    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8".parse()?);
    headers.insert("Accept-Language", "en-US,en;q=0.5".parse()?);
    headers.insert("Connection", "keep-alive".parse()?);
    headers.insert("Content-Type", "text/html;charset=utf-8".parse()?);
    headers.insert("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0".parse()?);

    let auth_url = "https://jwgl.bupt.edu.cn//Logon.do?method=logon&flag=sess";
    let login_url = "https://jwgl.bupt.edu.cn/Logon.do?method=logon";

    let mut auth_data = HashMap::new();
    auth_data.insert("userAccount", account);
    auth_data.insert("userPassword", password);

    let auth_response = client
        .post(auth_url)
        .headers(headers.clone())
        .form(&auth_data)
        .send()
        .await?;

    let datastr = auth_response.text().await?;


    let parts: Vec<&str> = datastr.split('#').collect();
    let scode = parts[0];
    let sxh = parts[1];
    let code = format!("{}%%%{}", account, password);

    let mut encoded = String::new();
    let mut scode_remaining = scode;

    for (i, c) in code.chars().enumerate() {
        if i < 20 {
            encoded.push(c);
            let idx: usize = sxh[i..i+1].parse()?;
            encoded.push_str(&scode_remaining[..idx]);
            scode_remaining = &scode_remaining[idx..];
        } else {
            encoded.push_str(&code[i..]);
            break;
        }
    }

    
    let mut login_data = HashMap::new();
    login_data.insert("userAccount", account);
    login_data.insert("userPassword", password);
    login_data.insert("encoded", &encoded);

    let _login_response = client
        .post(login_url)
        .headers(headers)
        .form(&login_data)
        .send()
        .await?;

    Ok(client)
}

pub async fn get_course_schedule(account: &str, password: &str) -> Result<String, Box<dyn std::error::Error>> {
    
    let client = jwxt_auth(account, password).await?;
    
    let schedule_url = "https://jwgl.bupt.edu.cn/jsxsd/framework/xsdPerson.jsp";

    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8".parse()?);
    headers.insert("Accept-Language", "en-US,en;q=0.5".parse()?);
    headers.insert("Connection", "keep-alive".parse()?);
    headers.insert("Content-Type", "text/html;charset=utf-8".parse()?);
    headers.insert("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0".parse()?);

    let schedule_response = client
        .get(schedule_url)
        .headers(headers)
        .send()
        .await?;

    let document = Html::parse_document(&schedule_response.text().await?);
    
    let table_selector = Selector::parse("div.table-content").unwrap();
    let ul_selector = Selector::parse("div.table-class > ul").unwrap();
    let li_selector = Selector::parse("li").unwrap();

    if let Some(table) = document.select(&table_selector).next() {
        let mut table_html = table.html();
        
        // 处理所有table-class div中的ul元素
        let table_doc = Html::parse_fragment(&table_html);
        for ul_element in table_doc.select(&ul_selector) {
                let mut new_ul_content = String::new();
                
                // 获取原ul的HTML内容
                let ul_html = ul_element.html();
                let ul_fragment = Html::parse_fragment(&ul_html);
                
                // 重构ul内容,只保留第1和第6个li
                for (index, li) in ul_fragment.select(&li_selector).enumerate() {
                    if index == 0 || index == 5 {
                        new_ul_content.push_str(&li.html());
                    }
                }
                
                // 替换原ul内容
                table_html = table_html.replace(&ul_html, &new_ul_content);
        }
        
        Ok(table_html)
    } else {
        Ok("No course schedule found.".to_string())
    }
}