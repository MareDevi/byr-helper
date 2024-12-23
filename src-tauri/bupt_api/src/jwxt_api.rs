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

    println!("{}", encoded);
    
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

async fn get_course_schedule(account: &str, password: &str) -> Result<String, Box<dyn std::error::Error>> {
    
    let client = jwxt_auth(account, password).await?;
    
    let schedule_url = "https://jwgl.bupt.edu.cn/jsxsd/xskb/xskb_list.do";

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
    
    let table_selector = Selector::parse("table#kbtable").unwrap();

    // 只获取id为kbtable的表格
    if let Some(table) = document.select(&table_selector).next() {
        Ok(table.html())
    }
    else {
        Ok("No course schedule found.".to_string())
    }
}