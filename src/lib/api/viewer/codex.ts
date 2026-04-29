import { invoke } from "@tauri-apps/api/core";

/**
 * Codex Viewer API
 * 调用 Rust 后端 Codex Viewer 命令
 */

// 类型定义 - 复用 FileNode
export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
  size: number;
  modified?: number;
}

// GitHub Release 类型
export interface GitHubRelease {
  tag_name: string;
  name: string;
  html_url: string;
  body?: string;
}

// Codex Session
export interface CodexSession {
  session_id: string;
  title?: string;
  created_at?: number;
  last_active_at?: number;
}

/**
 * 获取 Codex 配置目录
 */
export async function getCodexDir(): Promise<string> {
  return invoke("viewer_get_codex_dir");
}

/**
 * 获取 Codex 目录树
 * @param depth 目录深度，默认3层
 */
export async function getCodexDirTree(depth?: number): Promise<FileNode> {
  return invoke("viewer_get_codex_dir_tree", { depth });
}

/**
 * 读取文件内容
 */
export async function readCodexFile(path: string): Promise<string> {
  return invoke("viewer_codex_read_file", { path });
}

/**
 * 获取 Codex MCP 配置
 */
export async function getCodexMcpConfig(): Promise<any> {
  return invoke("viewer_get_codex_mcp_config");
}

/**
 * 获取 Codex Sessions 列表
 */
export async function getCodexSessions(): Promise<CodexSession[]> {
  return invoke("viewer_get_codex_sessions");
}

/**
 * 检测 Codex 最新版本
 */
export async function checkCodexVersion(): Promise<GitHubRelease> {
  return invoke("viewer_check_codex_version");
}
