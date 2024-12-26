use flate2::read::GzDecoder;
use regex::Regex;
use tauri_plugin_http::reqwest::header::COOKIE;
use tauri_plugin_http::reqwest::header::*;
use tauri_plugin_http::reqwest::Client;
use tauri_plugin_http::reqwest::Response;
use serde_json;
use std::collections::HashMap;
use anyhow::Result;

fn extract_values(html_content: &str) -> Option<String> {
    let re = Regex::new(r#"<input\s+name="execution"\s+value="([^"]+)""#).unwrap();
    if let Some(caps) = re.captures(html_content) {
        Some(caps[1].to_string())
    } else {
        println!("未找到execution的值");
        None
    }
}

async fn follow_redirects(client: &Client, mut res: Response) -> Response {
    while res.status().is_redirection() {
        let redirect_url = res.headers().get("Location").unwrap().to_str().unwrap();
        res = client.get(redirect_url).send().await.unwrap();
    }
    res
}

fn extract_ticket(redirect_url: &str) -> Option<String> {
    let ticket_pattern = r"ticket=(\S+)";
    let re = Regex::new(ticket_pattern).unwrap();
    if let Some(caps) = re.captures(redirect_url) {
        Some(caps[1].to_string())
    } else {
        println!("未找到ticket的值");
        None
    }
}

fn extract_js_links(html_content: &str) -> Vec<String> {
    let js_links_re = Regex::new(r#"<script\s+src="([^"]+\.js)"></script>"#).unwrap();
    js_links_re
        .captures_iter(html_content)
        .map(|caps| caps[1].to_string())
        .collect()
}

fn extract_auth_and_tenant(js_content: &str) -> (String, String) {
    let pattern: &str = r#"Authorization:\s*"([^"]+)"\s*,\s*"Tenant-Id":\s*"([^"]+)""#;
    let re = Regex::new(pattern).unwrap();
    let mut auth_token = String::new();
    let mut tenant_id = String::new();
    for cap in re.captures_iter(js_content) {
        auth_token = cap[1].to_string();
        tenant_id = cap[2].to_string();
    }
    (auth_token, tenant_id)
}

pub async fn bupt_auth(account: String, ucloud_password: String, jwxt_password: String) -> Result<String> {
    let auth_url = "https://auth.bupt.edu.cn/authserver/login?service=http://ucloud.bupt.edu.cn";

    let client = Client::builder()
        .cookie_store(true)
        .redirect(tauri_plugin_http::reqwest::redirect::Policy::none())
        .build()
        ?;

    let res = follow_redirects(&client, client.get(auth_url).send().await.unwrap()).await;
    let exe = extract_values(res.text().await.unwrap().as_str()).unwrap();
    let login_url = "https://auth.bupt.edu.cn/authserver/login?service=http://ucloud.bupt.edu.cn";

    let mut data = HashMap::new();
    data.insert("username", account.as_str());
    data.insert("password", ucloud_password.as_str());
    data.insert("submit", &"登录");
    data.insert("type", &"username_password");
    data.insert("execution", &exe);
    data.insert("_eventId", &"submit");

    let res = client.post(login_url).form(&data).send().await.unwrap();
    let redirect_url = res.headers().get("Location")
        .ok_or_else(|| anyhow::anyhow!("Missing Location header"))?
        .to_str()
        .map_err(|e| anyhow::anyhow!("Invalid Location header: {}", e))?;
    let cookie = res.headers().get("Set-Cookie").unwrap().to_str().unwrap();

    let ticket = extract_ticket(redirect_url).unwrap();
    let res = client
        .post(redirect_url)
        .header(COOKIE, cookie)
        .send()
        .await
        .unwrap();

    let redirect_url = res.headers().get("Location").unwrap().to_str().unwrap();

    let res = client
        .get(redirect_url)
        .header(COOKIE, cookie)
        .send()
        .await
        .unwrap();

    let js_links = extract_js_links(res.text().await.unwrap().as_str());
    let mut js_content = String::new();
    for link in js_links {
        if link.contains("index") {
            js_content = client
                .get(format!("https://ucloud.bupt.edu.cn/{}", link))
                .send()
                .await
                .unwrap()
                .text()
                .await
                .unwrap();
        }
    }

    let (auth_token, tenant_id) = extract_auth_and_tenant(&js_content);
    let api_url = "https://apiucloud.bupt.edu.cn/ykt-basics/oauth/token";

    let mut headers = HeaderMap::new();
    headers.insert(
        "Accept",
        HeaderValue::from_static("application/json, text/plain, */*"),
    );
    headers.insert(
        "Accept-Encoding",
        HeaderValue::from_static("gzip, deflate, br"),
    );
    headers.insert(
        "Accept-Language",
        HeaderValue::from_static("zh-CN,zh;q=0.9"),
    );
    headers.insert("Authorization", HeaderValue::from_str(&auth_token).unwrap());
    headers.insert(
        "Content-Type",
        HeaderValue::from_static("application/x-www-form-urlencoded"),
    );
    headers.insert(
        "Origin",
        HeaderValue::from_static("https://ucloud.bupt.edu.cn"),
    );
    headers.insert(
        "Referer",
        HeaderValue::from_static("https://ucloud.bupt.edu.cn/"),
    );
    headers.insert(
        "Sec-Ch-Ua",
        HeaderValue::from_static(
            "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Microsoft Edge\";v=\"122\"",
        ),
    );
    headers.insert("Sec-Ch-Ua-Mobile", HeaderValue::from_static("?0"));
    headers.insert(
        "Sec-Ch-Ua-Platform",
        HeaderValue::from_static("\"Windows\""),
    );
    headers.insert("Sec-Fetch-Dest", HeaderValue::from_static("empty"));
    headers.insert("Sec-Fetch-Mode", HeaderValue::from_static("cors"));
    headers.insert("Sec-Fetch-Site", HeaderValue::from_static("same-site"));
    headers.insert("Tenant-Id", HeaderValue::from_str(&tenant_id).unwrap());
    headers.insert("User-Agent", HeaderValue::from_static("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0"));

    let mut data = HashMap::new();
    data.insert("ticket", ticket.as_str());
    data.insert("grant_type", "third");


    let client = Client::new();

    let res = client
        .post(api_url)
        .headers(headers)
        .form(&data)
        .send()
        .await
        .unwrap();

    let body = res.bytes().await.unwrap();

    let decompressed_body = {
        let mut decoder = GzDecoder::new(&body[..]);
        let mut decompressed_body = Vec::new();
        use std::io::Read;
        decoder.read_to_end(&mut decompressed_body).unwrap();
        decompressed_body
    };

    let decompressed_text = String::from_utf8(decompressed_body).unwrap();

    let json: serde_json::Value = serde_json::from_str(&decompressed_text).unwrap();

    let blade = json["access_token"].as_str().unwrap();
    let user_id = json["user_id"].as_str().unwrap();

    let mut map = HashMap::new();
    map.insert("account", account);
    map.insert("ucloud_password", ucloud_password);
    map.insert("jwxt_password", jwxt_password);
    map.insert("tenant_id", tenant_id);
    map.insert("blade", blade.to_string());
    map.insert("user_id", user_id.to_string());
    map.insert("auth_token", auth_token);

    let json = serde_json::to_string(&map).unwrap();

    Ok(json)
}