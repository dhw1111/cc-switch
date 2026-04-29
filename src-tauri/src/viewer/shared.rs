//! Viewer 模块共享类型
//!
//! 所有 viewer (ccviewer, hermes, opencode, codex) 共用的类型定义

use serde::{Deserialize, Serialize};

/// 目录树节点
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
    pub size: u64,
    pub modified: Option<u64>,
}

/// GitHub Release 信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubRelease {
    pub tag_name: String,
    pub name: String,
    pub html_url: String,
    pub body: Option<String>,
}
