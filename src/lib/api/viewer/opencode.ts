import { invoke } from "@tauri-apps/api/core";

/**
 * OpenCode Viewer API
 * 调用 Rust 后端 OpenCode Viewer 命令
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

/**
 * 获取 OpenCode 配置目录
 */
export async function getOpenCodeDir(): Promise<string> {
  return invoke("viewer_get_opencode_dir");
}

/**
 * 获取 OpenCode 目录树
 * @param depth 目录深度，默认3层
 */
export async function getOpenCodeDirTree(depth?: number): Promise<FileNode> {
  return invoke("viewer_get_opencode_dir_tree", { depth });
}

/**
 * 读取文件内容
 */
export async function readOpenCodeFile(path: string): Promise<string> {
  return invoke("viewer_opencode_read_file", { path });
}

/**
 * 获取 OpenCode MCP 配置
 */
export async function getOpenCodeMcpConfig(): Promise<any> {
  return invoke("viewer_get_opencode_mcp_config");
}

/**
 * 检测 OpenCode 最新版本
 */
export async function checkOpenCodeVersion(): Promise<GitHubRelease> {
  return invoke("viewer_check_opencode_version");
}
