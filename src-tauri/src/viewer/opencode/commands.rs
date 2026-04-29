//! OpenCode Viewer 命令
//!
//! 提供查看和浏览 OpenCode 配置的功能

use crate::opencode_config;
use crate::viewer::shared::{FileNode, GitHubRelease};
use std::fs;
use std::path::PathBuf;

/// 获取 OpenCode 配置目录
#[tauri::command]
pub fn viewer_get_opencode_dir() -> Result<String, String> {
    let dir = opencode_config::get_opencode_dir();
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

/// 获取 OpenCode 目录树
#[tauri::command]
pub fn viewer_get_opencode_dir_tree(depth: Option<usize>) -> Result<FileNode, String> {
    let dir = opencode_config::get_opencode_dir();

    if !dir.exists() {
        return Err("OpenCode config directory not found".to_string());
    }

    Ok(read_dir_recursive(&dir, depth.unwrap_or(3), 0))
}

/// 读取文件内容
#[tauri::command]
pub fn viewer_opencode_read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

/// 获取 OpenCode MCP 配置
#[tauri::command]
pub fn viewer_get_opencode_mcp_config() -> Result<serde_json::Value, String> {
    let servers = opencode_config::get_mcp_servers().map_err(|e| e.to_string())?;

    let map: serde_json::Map<String, serde_json::Value> = servers
        .into_iter()
        .collect();

    Ok(serde_json::Value::Object(map))
}

/// 检测 OpenCode 最新版本
#[tauri::command]
pub async fn viewer_check_opencode_version() -> Result<GitHubRelease, String> {
    let response = reqwest::Client::new()
        .get("https://api.github.com/repos/opencode-ai/opencode/releases/latest")
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
