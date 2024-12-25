use anyhow::Result;
use regex::Regex;

pub async fn process_notifications(
    blade: &str,
    tenant_id: &str,
    user_id: &str,
    auth_token: &str,
) -> Result<Vec<String>> {
    let data = bupt_api::get_notifications(blade, tenant_id, user_id, auth_token).await.unwrap();
    let span_regex = Regex::new(r"</?span>").unwrap();
    
    let mut result = Vec::new();
    
    result.extend(
        data.into_iter()
            .filter_map(|notification| {
                match (
                    notification["newsInfo"].as_str(),
                    notification["newsTitle"].as_str()
                ) {
                    (Some(news_info), Some(news_title)) => {
                        let cleaned_info = span_regex.replace_all(news_info, "");
                        Some(format!("{}:  {}", news_title, cleaned_info))
                    },
                    _ => None
                }
            })
    );
    Ok(result)
}