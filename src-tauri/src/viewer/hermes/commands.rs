//! Hermes Viewer 命令
//!
//! 提供查看和浏览 Hermes Agent 配置的功能

use crate::hermes_config;
use crate::viewer::shared::{FileNode, GitHubRelease};
use std::fs;
use std::path::PathBuf;

/// 获取 Hermes 配置目录
#[tauri::command]
pub fn viewer_get_hermes_dir() -> Result<String, String> {
    let dir = hermes_config::get_hermes_dir();
    Ok(dir.to_string_lossy().to_string())
}

/// 读取目录树结构
fn read_dir_recursive(path: &PathBuf, max_depth: usize, current_depth: usize) -> FileNode {
    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string_lossy().to_string());

    let metadata = fs::metadata(path).ok();
    let is_dir = metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false);

    let size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
    let modified = metadata
        .as_ref()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs());

    let children = if is_dir && current_depth < max_depth {
        fs::read_dir(path)
            .ok()
            .map(|entries| {
                entries
                    .filter_map(|e| e.ok())
                    .map(|e| read_dir_recursive(&e.path(), max_depth, current_depth + 1))
                    .collect()
            })
    } else {
        None
    };

    FileNode {
        name,
        path: path.to_string_lossy().to_string(),
        is_dir,
        children,
        size,
        modified,
    }
}

/// 获取 Hermes 目录树
#[tauri::command]
pub fn viewer_get_hermes_dir_tree(depth: Option<usize>) -> Result<FileNode, String> {
    let dir = hermes_config::get_hermes_dir();

    if !dir.exists() {
        return Err("Hermes config directory not found".to_string());
    }

    Ok(read_dir_recursive(&dir, depth.unwrap_or(3), 0))
}

/// 读取文件内容
#[tauri::command]
pub fn viewer_hermes_read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

/// 读取 Hermes config.yaml 并返回 JSON 格式
#[tauri::command]
pub fn viewer_get_hermes_config() -> Result<serde_json::Value, String> {
    let config = hermes_config::read_hermes_config().map_err(|e| e.to_string())?;
    hermes_config::yaml_to_json(&config).map_err(|e| e.to_string())
}

/// 获取 Hermes MCP 服务器配置
#[tauri::command]
pub fn viewer_get_hermes_mcp_config() -> Result<serde_json::Value, String> {
    let yaml_map = hermes_config::get_mcp_servers_yaml().map_err(|e| e.to_string())?;

    // Convert YAML mapping to JSON
    let json_map: serde_json::Map<String, serde_json::Value> = yaml_map
        .into_iter()
        .filter_map(|(k, v)| {
            let key = k.as_str().map(String::from)?;
            let json_val = hermes_config::yaml_to_json(&v).ok()?;
            Some((key, json_val))
        })
        .collect();

    Ok(serde_json::Value::Object(json_map))
}

/// 获取 Hermes 内存文件内容
#[tauri::command]
pub fn viewer_get_hermes_memory(kind: String) -> Result<String, String> {
    use hermes_config::MemoryKind;

    let memory_kind = match kind.as_str() {
        "memory" => MemoryKind::Memory,
        "user" => MemoryKind::User,
        _ => return Err("Invalid memory kind. Use 'memory' or 'user'".to_string()),
    };

    hermes_config::read_memory(memory_kind).map_err(|e| e.to_string())
}

/// 写入 Hermes 内存文件
#[tauri::command]
pub fn viewer_write_hermes_memory(kind: String, content: String) -> Result<(), String> {
    use hermes_config::MemoryKind;

    let memory_kind = match kind.as_str() {
        "memory" => MemoryKind::Memory,
        "user" => MemoryKind::User,
        _ => return Err("Invalid memory kind. Use 'memory' or 'user'".to_string()),
    };

    hermes_config::write_memory(memory_kind, &content).map_err(|e| e.to_string())
}

/// 获取 Hermes 模型配置
#[tauri::command]
pub fn viewer_get_hermes_model_config() -> Result<serde_json::Value, String> {
    let model = hermes_config::get_model_config()
        .map_err(|e| e.to_string())?
        .ok_or("No model config found")?;

    serde_json::to_value(model).map_err(|e| e.to_string())
}

/// 获取 Hermes Memory Limits
#[tauri::command]
pub fn viewer_get_hermes_memory_limits() -> Result<serde_json::Value, String> {
    let limits = hermes_config::read_memory_limits().map_err(|e| e.to_string())?;
    serde_json::to_value(limits).map_err(|e| e.to_string())
}

/// 检测 Hermes 最新版本
#[tauri::command]
pub async fn viewer_check_hermes_version() -> Result<GitHubRelease, String> {
    let response = reqwest::Client::new()
        .get("https://api.github.com/repos/farion1231/hermes/releases/latest")
        .header("User-Agent", "ccViewer")
        .header("Accept", "application/vnd.github.v3+json")
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("GitHub API returned status: {}", response.status()));
    }

    let release: GitHubRelease = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(release)
}
