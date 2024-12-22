use anyhow::Result;
use bupt_api::get_todo_list;

pub async fn process_todo_list(
    blade: &str,
    tenant_id: &str,
    user_id: &str,
    auth_token: &str,
) -> Result<Vec<std::collections::HashMap<String, String>>> {
    let data = get_todo_list(blade, tenant_id, user_id, auth_token).await?;
    let mut todos = Vec::new();
    for item in data {
        let mut todo = std::collections::HashMap::new();
        todo.insert("Name".to_string(), item["activityName"].to_string());
        todo.insert("EndTime".to_string(), item["endTime"].to_string());
        todo.insert("Subject".to_string(), item["siteName"].to_string());
        todo.insert("Id".to_string(), item["activityId"].to_string());
        todos.push(todo);
    }

    Ok(todos)
}
