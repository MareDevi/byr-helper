use anyhow::Result;
use reqwest;
use serde_json::{self, Value};
use std::path;
pub mod bupt_auth;

const UCLOUD_API_URL: &str = "https://apiucloud.bupt.edu.cn";
const UCLOUD_COURSE_FILE_URL: &str = "https://fileucloud.bupt.edu.cn/ucloud/document/";
const UCLOUD_ASSIGNMENT_FILE_URL: &str =
    "https://apiucloud.bupt.edu.cn/blade-source/resource/filePath";

fn build_headers(blade: &str, tenant_id: &str, auth_token: &str) -> reqwest::header::HeaderMap {
    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0"
            .parse()
            .unwrap(),
    );
    headers.insert(
        "Accept",
        "application/json, text/plain, */*".parse().unwrap(),
    );
    headers.insert("Authorization", auth_token.parse().unwrap());
    headers.insert("Tenant-Id", tenant_id.parse().unwrap());
    headers.insert("Blade-Auth", blade.parse().unwrap());
    headers
}

pub fn get_auth_info() -> Result<Vec<String>> {
    let auth_path = path::Path::new("../auth.json");
    if !auth_path.exists() {
        return Err(anyhow::anyhow!("auth.json not found"));
    }

    let auth_content = std::fs::read_to_string(auth_path)?;
    let json: serde_json::Value = serde_json::from_str(&auth_content)?;

    let result = vec!["blade", "tenant_id", "user_id", "auth_token"]
        .into_iter()
        .map(|key| json[key].as_str().unwrap().to_string())
        .collect::<Vec<String>>();

    Ok(result)
}

pub async fn get_courses(
    blade: &str,
    tenant_id: &str,
    user_id: &str,
    auth_token: &str,
) -> Result<Vec<Value>> {
    let client = reqwest::Client::new();
    let headers = build_headers(blade, tenant_id, auth_token);

    let response = client
        .get(format!(
            "{}/ykt-site/site/list/student/current",
            UCLOUD_API_URL
        ))
        .headers(headers)
        .query(&[("userId", user_id), ("size", "999999"), ("current", "1")])
        .send()
        .await?;

    let json: serde_json::Value = response.json().await?;
    let records = json["data"]["records"].as_array().unwrap();

    Ok(records.to_vec())
}

pub async fn get_course_detail(
    blade: &str,
    tenant_id: &str,
    auth_token: &str,
    course_id: &str,
) -> Result<()> {
    let client = reqwest::Client::new();
    let headers = build_headers(blade, tenant_id, auth_token);

    let response = client
        .get(format!("{}/ykt-site/site/detail", UCLOUD_API_URL))
        .headers(headers)
        .query(&[("id", course_id)])
        .send()
        .await?;

    let json: serde_json::Value = response.json().await?;
    println!("{}", json["data"]);

    Ok(())
}

pub async fn get_course_files(
    blade: &str,
    tenant_id: &str,
    user_id: &str,
    auth_token: &str,
    course_id: &str,
) -> Result<()> {
    let client = reqwest::Client::new();
    let headers = build_headers(blade, tenant_id, auth_token);

    let response = client
        .post(format!(
            "{}/ykt-site/site-resource/tree/student",
            UCLOUD_API_URL
        ))
        .headers(headers)
        .query(&[("siteId", course_id), ("userId", user_id)])
        .send()
        .await?;

    let json: serde_json::Value = response.json().await?;
    let data = json["data"].as_array().unwrap();

    // Process main attachments
    data.iter()
        .flat_map(|record| {
            let attachments = record["attachmentVOs"]
                .as_array()
                .into_iter()
                .flatten()
                .map(|attachment| &attachment["resource"]);

            let child_attachments = record["children"]
                .as_array()
                .into_iter()
                .flatten()
                .flat_map(|child| {
                    child["attachmentVOs"]
                        .as_array()
                        .into_iter()
                        .flatten()
                        .map(|attachment| &attachment["resource"])
                });

            attachments.chain(child_attachments)
        })
        .for_each(|resource| {
            println!(
                "{} {} {}",
                resource["name"].as_str().unwrap(),
                resource["storageId"].as_str().unwrap(),
                resource["ext"].as_str().unwrap()
            );
        });

    Ok(())
}

pub async fn get_assignments(
    blade: &str,
    tenant_id: &str,
    user_id: &str,
    auth_token: &str,
    course_id: &str,
) -> Result<()> {
    let client = reqwest::Client::new();
    let headers = build_headers(blade, tenant_id, auth_token);

    let body = serde_json::json!({
        "userId": user_id,
        "siteId": course_id,
    });

    let response = client
        .post(format!("{}/ykt-site/work/student/list", UCLOUD_API_URL))
        .headers(headers)
        .json(&body)
        .send()
        .await?;

    let json: serde_json::Value = response.json().await?;
    let records = json["data"]["records"].as_array().unwrap();

    for record in records {
        println!("{}", record);
    }

    Ok(())
}

pub async fn get_assignment_detail(
    blade: &str,
    tenant_id: &str,
    auth_token: &str,
    assignment_id: &str,
) -> Result<Value> {
    let client = reqwest::Client::new();
    let headers = build_headers(blade, tenant_id, auth_token);

    let response = client
        .get(format!("{}/ykt-site/work/detail", UCLOUD_API_URL))
        .headers(headers)
        .query(&[("assignmentId", assignment_id)])
        .send()
        .await?;

    let json: serde_json::Value = response.json().await?;
    let data = &json["data"];

    Ok(data.clone())
}

pub async fn get_todo_list(
    blade: &str,
    tenant_id: &str,
    user_id: &str,
    auth_token: &str,
) -> Result<Vec<Value>> {
    let client = reqwest::Client::new();
    let headers = build_headers(blade, tenant_id, auth_token);

    let response = client
        .get(format!("{}/ykt-site/site/student/undone", UCLOUD_API_URL))
        .headers(headers)
        .query(&[("userId", user_id)])
        .send()
        .await?;

    let json: serde_json::Value = response.json().await?;
    let undone_list = json["data"]["undoneList"].as_array().unwrap();

    return Ok(undone_list.to_vec());
    
}

pub async fn download_course_file(
    file_name: &str,
    storage_id: &str,
    file_format: &str,
) -> Result<()> {
    let client = reqwest::Client::new();
    let headers = reqwest::header::HeaderMap::from_iter(
        [
            (
                "User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
            ),
            (
                "Accept",
                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            ),
            ("Accept-Language", "en-US,en;q=0.5"),
            ("Accept-Encoding", "gzip, deflate, br, zstd"),
            ("Connection", "keep-alive"),
            ("Upgrade-Insecure-Requests", "1"),
            ("Sec-Fetch-Dest", "document"),
            ("Sec-Fetch-Mode", "navigate"),
            ("Sec-Fetch-Site", "none"),
            ("Sec-Fetch-User", "?1"),
            ("Priority", "u=0, i"),
        ]
        .iter()
        .map(|(k, v)| (k.parse().unwrap(), v.parse().unwrap())),
    );

    let response = client
        .get(format!(
            "{}{}.{}",
            UCLOUD_COURSE_FILE_URL, storage_id, file_format
        ))
        .headers(headers)
        .send()
        .await?;

    let bytes = response.bytes().await?;
    std::fs::write(file_name, bytes)?;
    Ok(())
}

pub async fn download_assignment_file(
    blade: &str,
    tenant_id: &str,
    auth_token: &str,
    path: &str,
    resource_id: &str,
) -> Result<()> {
    let client = reqwest::Client::new();
    let headers = build_headers(blade, tenant_id, auth_token);

    let response = client
        .get(UCLOUD_ASSIGNMENT_FILE_URL)
        .headers(headers)
        .query(&[("resourceId", resource_id)])
        .send()
        .await?;

    let json: serde_json::Value = response.json().await?;
    let file_url = json["data"].as_str().unwrap();

    let file_response = client.get(file_url).send().await?;
    let bytes = file_response.bytes().await?;

    let full_path = std::path::Path::new(path);
    std::fs::write(full_path, bytes)?;

    Ok(())
}

//unit test
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_auth_info() {
        get_auth_info().unwrap();
    }

    #[tokio::test]
    async fn test_get_courses() {
        let auth_info = get_auth_info().unwrap();
        get_courses(&auth_info[0], &auth_info[1], &auth_info[2], &auth_info[3])
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn test_get_course_detail() {
        let auth_info = get_auth_info().unwrap();
        get_course_detail(
            &auth_info[0],
            &auth_info[1],
            &auth_info[3],
            "1825066977870606341",
        )
        .await
        .unwrap();
    }

    #[tokio::test]
    async fn test_get_course_files() {
        let auth_info = get_auth_info().unwrap();
        get_course_files(
            &auth_info[0],
            &auth_info[1],
            &auth_info[2],
            &auth_info[3],
            "1825066977593782277",
        )
        .await
        .unwrap();
    }

    #[tokio::test]
    async fn test_get_assignments() {
        let auth_info = get_auth_info().unwrap();
        get_assignments(
            &auth_info[0],
            &auth_info[1],
            &auth_info[2],
            &auth_info[3],
            "1825066977870606341",
        )
        .await
        .unwrap();
    }

    #[tokio::test]
    async fn test_get_assignment_detail() {
        let auth_info = get_auth_info().unwrap();
        let data = get_assignment_detail(
            &auth_info[0],
            &auth_info[1],
            &auth_info[3],
            "1868893862338715650",
        )
        .await
        .unwrap();

        println!("{:?}", data)
    }

    #[tokio::test]
    async fn test_get_todo_list() {
        let auth_info = get_auth_info().unwrap();
        get_todo_list(&auth_info[0], &auth_info[1], &auth_info[2], &auth_info[3])
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn test_download_course_file() {
        download_course_file(
            "2024级导读.pptx",
            "d4df3c8f2c74a26aea13ff657aaab8e3",
            "pptx",
        )
        .await
        .unwrap();
    }

    #[tokio::test]
    async fn test_download_assignment_file() {
        let auth_info = get_auth_info().unwrap();
        download_assignment_file(
            &auth_info[0],
            &auth_info[1],
            &auth_info[3],
            "./",
            "1868893862024007682",
        )
        .await
        .unwrap();
    }
}
