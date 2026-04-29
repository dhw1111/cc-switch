import { invoke } from "@tauri-apps/api/core";

/**
 * ccViewer API
 * 调用 Rust 后端 ccviewer 命令
 */

// 类型定义
export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
  size: number;
  modified?: number;
}

/**
 * 获取 Claude Code 配置目录
 */
export async function getClaudeDir(): Promise<string> {
  return invoke("get_claude_dir");
}

/**
 * 获取 Claude Code 配置目录树
 * @param depth 目录深度，默认3层
 */
export async function getClaudeDirTree(depth?: number): Promise<FileNode> {
  return invoke("get_claude_dir_tree", { depth });
}

/**
 * 读取文件内容
 */
export async function readFileContent(path: string): Promise<string> {
  return invoke("read_file_content", { path });
}

/**
 * 读取 JSON 文件并解析
 */
export async function readJsonFile(path: string): Promise<any> {
  return invoke("read_json_file", { path });
}

/**
 * 执行 Claude Code 命令
 * @param args 命令参数
 */
export async function executeClaudeCommand(args: string[]): Promise<string> {
  return invoke("execute_claude_command", { args });
}

/**
 * 获取 Claude Code 版本
 */
export async function getClaudeVersion(): Promise<string> {
  return invoke("get_claude_version");
}

/**
 * 获取 Claude Code Skills 列表
 */
export async function getClaudeSkills(): Promise<FileNode[]> {
  return invoke("get_claude_skills");
}

/**
 * 获取 Claude Code Plugins 列表
 */
export async function getClaudePlugins(): Promise<FileNode[]> {
  return invoke("get_claude_plugins");
}

/**
 * 获取 MCP 配置
 */
export async function getMcpConfig(): Promise<any> {
  return invoke("ccviewer_get_mcp_config");
}

/**
 * 获取 Settings 配置
 */
export async function getSettingsConfig(): Promise<any> {
  return invoke("get_settings_config");
}

/**
 * 获取本地 Settings 配置
 */
export async function getSettingsLocalConfig(): Promise<any> {
  return invoke("get_settings_local_config");
}

// GitHub Release 类型
export interface GitHubRelease {
  tag_name: string;
  name: string;
  html_url: string;
  body?: string;
}

/**
 * 检测 Claude Code 最新版本
 */
export async function checkClaudeLatestVersion(): Promise<GitHubRelease> {
  return invoke("check_claude_latest_version");
}
