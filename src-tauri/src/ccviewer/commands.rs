#![allow(non_snake_case)]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;

/// 获取 Claude Code 的配置目录
#[tauri::command]
pub fn get_claude_dir() -> Result<String, String> {
    let home = dirs::home_dir().ok_or("Cannot find home directory")?;
    let claude_dir = home.join(".claude");
    Ok(claude_dir.to_string_lossy().to_string())
}

/// 读取目录树结构
#[derive(Debug, Serialize, Deserialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
    pub size: u64,
    pub modified: Option<u64>,
}

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

#[tauri::command]
pub fn get_claude_dir_tree(depth: Option<usize>) -> Result<FileNode, String> {
    let home = dirs::home_dir().ok_or("Cannot find home directory")?;
    let claude_dir = home.join(".claude");

    if !claude_dir.exists() {
        return Err("Claude config directory not found".to_string());
    }

    Ok(read_dir_recursive(&claude_dir, depth.unwrap_or(3), 0))
}

/// 读取文件内容
#[tauri::command]
pub fn read_file_content(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

/// 读取 JSON 文件并解析
#[tauri::command]
pub fn read_json_file(path: String) -> Result<serde_json::Value, String> {
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;
    serde_json::from_str(&content).map_err(|e| format!("Failed to parse JSON: {}", e))
}

/// 执行 Claude Code 命令
#[tauri::command]
pub async fn execute_claude_command(args: Vec<String>) -> Result<String, String> {
    // 首先尝试从 PATH 中找到 claude
    let claude_path = std::env::var("CLAUDE_PATH").unwrap_or_else(|_| {
        // 尝试 which claude
        if let Ok(output) = std::process::Command::new("which").arg("claude").output() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() && std::path::Path::new(&path).exists() {
                return path;
            }
        }
        // 回退到默认路径
        if cfg!(target_os = "macos") {
            "/opt/homebrew/bin/claude".to_string()
        } else {
            "claude".to_string()
        }
    });

    let output = Command::new(&claude_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute command: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(stdout)
    } else {
        Err(format!("Command failed: {}\n{}", stdout, stderr))
    }
}

/// 获取 Claude Code 版本
#[tauri::command]
pub fn get_claude_version() -> Result<String, String> {
    // 首先尝试从 PATH 中找到 claude
    let claude_path = std::env::var("CLAUDE_PATH").unwrap_or_else(|_| {
        // 尝试 which claude
        if let Ok(output) = std::process::Command::new("which").arg("claude").output() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() && std::path::Path::new(&path).exists() {
                return path;
            }
        }
        // 回退到默认路径
        if cfg!(target_os = "macos") {
            "/opt/homebrew/bin/claude".to_string()
        } else {
            "claude".to_string()
        }
    });

    let output = Command::new(&claude_path)
        .args(["--version"])
        .output()
        .map_err(|e| format!("Failed to get version: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err("Failed to get Claude version".to_string())
    }
}

/// 列出 Claude Code 技能目录
#[tauri::command]
pub fn get_claude_skills() -> Result<Vec<FileNode>, String> {
    let home = dirs::home_dir().ok_or("Cannot find home directory")?;
    let skills_dir = home.join(".claude").join("skills");

    if !skills_dir.exists() {
        return Ok(vec![]);
    }

    let entries = fs::read_dir(&skills_dir).map_err(|e| format!("Failed to read skills dir: {}", e))?;

    let mut skills = vec![];
    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_dir() {
            skills.push(read_dir_recursive(&path, 2, 0));
        }
    }

    Ok(skills)
}

/// 列出 Claude Code 插件目录
#[tauri::command]
pub fn get_claude_plugins() -> Result<Vec<FileNode>, String> {
    let home = dirs::home_dir().ok_or("Cannot find home directory")?;
    let plugins_dir = home.join(".claude").join("plugins");

    if !plugins_dir.exists() {
        return Ok(vec![]);
    }

    let entries = fs::read_dir(&plugins_dir).map_err(|e| format!("Failed to read plugins dir: {}", e))?;

    let mut plugins = vec![];
    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_dir() {
            plugins.push(read_dir_recursive(&path, 2, 0));
        }
    }

    Ok(plugins)
}

/// 读取 MCP 配置 (ccViewer 专用)
#[tauri::command]
pub fn ccviewer_get_mcp_config() -> Result<serde_json::Value, String> {
    let home = dirs::home_dir().ok_or("Cannot find home directory")?;
    let mcp_path = home.join(".claude").join("mcp.json");

    if !mcp_path.exists() {
        return Err("MCP config file not found".to_string());
    }

    read_json_file(mcp_path.to_string_lossy().to_string())
}

/// 读取 Settings 配置
#[tauri::command]
pub fn get_settings_config() -> Result<serde_json::Value, String> {
    let home = dirs::home_dir().ok_or("Cannot find home directory")?;
    let settings_path = home.join(".claude").join("settings.json");

    if !settings_path.exists() {
        return Err("Settings file not found".to_string());
    }

    read_json_file(settings_path.to_string_lossy().to_string())
}

/// 读取本地环境配置
#[tauri::command]
pub fn get_settings_local_config() -> Result<serde_json::Value, String> {
    let home = dirs::home_dir().ok_or("Cannot find home directory")?;
    let settings_local_path = home.join(".claude").join("settings.local.json");

    if !settings_local_path.exists() {
        return Err("Local settings file not found".to_string());
    }

    read_json_file(settings_local_path.to_string_lossy().to_string())
}

/// GitHub release 信息
#[derive(Debug, Serialize, Deserialize)]
pub struct GitHubRelease {
    pub tag_name: String,
    pub name: String,
    pub html_url: String,
    pub body: Option<String>,
}

/// 检测 Claude Code 最新版本
#[tauri::command]
pub async fn check_claude_latest_version() -> Result<GitHubRelease, String> {
    let response = reqwest::Client::new()
        .get("https://api.github.com/repos/anthropics/claude-code/releases/latest")
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
