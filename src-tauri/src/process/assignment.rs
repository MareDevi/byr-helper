use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

use crate::interface;

#[derive(Debug, Serialize, Deserialize)]
pub struct ResourceInfo {
    resource_id: String,
    resource_type: String,
}

pub async fn process_assignment_detail(
    blade: &str,
    tenant_id: &str,
    auth_token: &str,
    assignment_id: &str,
) -> Result<(Vec<String>, HashMap<String, ResourceInfo>)> {
    let data = interface::bupt_api::get_assignment_detail(blade, tenant_id, auth_token, assignment_id).await?;
    let mut detail = Vec::new();
    let mut resource_map = HashMap::new();

    detail.push(data["assignmentTitle"].as_str().unwrap().to_string());
    detail.push(data["assignmentContent"].as_str().unwrap().to_string());
    detail.push(data["assignmentEndTime"].as_str().unwrap().to_string());

    if let Some(resource) = data.get("assignmentResource") {
        resource_map = process_resource_data(resource);
    }

    Ok((detail, resource_map))
}

fn process_resource_data(resource: &Value) -> HashMap<String, ResourceInfo> {
    let mut resource_map = HashMap::new();

    if let Some(resources) = resource.as_array() {
        for res in resources {
            if let (Some(id), Some(name), Some(res_type)) = (
                res.get("resourceId").and_then(|id| id.as_str()),
                res.get("resourceName").and_then(|n| n.as_str()),
                res.get("resourceType").and_then(|t| t.as_str()),
            ) {
                resource_map.insert(
                    name.to_string(),
                    ResourceInfo {
                        resource_id: id.to_string(),
                        resource_type: res_type.to_string(),
                    },
                );
            }
        }
    }

    resource_map
}
