use crate::process;
use crate::process::assignment::ResourceInfo;
use anyhow::Result;
use bupt_api::bupt_auth::bupt_auth;
use std::collections::HashMap;

#[tauri::command]
pub async fn get_auth(account: String, ucloud_password: String, jwxt_password: String) -> Result<(), String> {
    match bupt_auth(account, ucloud_password, jwxt_password).await {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn check_auth() -> Result<Vec<String>, String> {
    match bupt_api::get_auth_info() {
        //get_auth_info() return a Result: Ok(Vec<String>) or Err(_)
        Ok(vec) => Ok(vec),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn get_todo(
    blade: &str,
    tenant_id: &str,
    user_id: &str,
    auth_token: &str,
) -> Result<Vec<std::collections::HashMap<String, String>>, String> {
    match process::todolist::process_todo_list(blade, tenant_id, user_id, auth_token).await {
        Ok(vec) => Ok(vec),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn get_todo_dtail(
    blade: &str,
    tenant_id: &str,
    auth_token: &str,
    assignment_id: &str,
) -> Result<(Vec<String>, HashMap<String, ResourceInfo>), String> {
    match process::assignment::process_assignment_detail(
        blade,
        tenant_id,
        auth_token,
        assignment_id,
    )
    .await
    {
        Ok((detail, resources)) => Ok((detail, resources)),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn download_assignment_file(
    blade: &str,
    tenant_id: &str,
    auth_token: &str,
    path: &str,
    resource_id: &str,
) -> Result<(), String> {
    match bupt_api::download_assignment_file(
        blade,
        tenant_id,
        auth_token,
        path,
        resource_id,
    )
    .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn get_course_schedule(
    account: &str,
    password: &str,
) -> Result<String, String> {
    match bupt_api::jwxt_api::get_course_schedule(account, password).await {
        Ok(vec) => Ok(vec),
        Err(e) => Err(e.to_string()),
    }
}


#[tauri::command]
pub async fn get_notifications(
    blade: &str,
    tenant_id: &str,
    user_id: &str,
    auth_token: &str,
) -> Result<Vec<String>, String> {
    match process::notifications::process_notifications(blade, tenant_id, user_id, auth_token).await {
        Ok(vec) => Ok(vec),
        Err(e) => Err(e.to_string()),
    }
}