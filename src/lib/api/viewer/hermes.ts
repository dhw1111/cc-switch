import { invoke } from "@tauri-apps/api/core";

/**
 * Hermes Viewer API
 * 调用 Rust 后端 Hermes Viewer 命令
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

// Hermes Memory Limits
export interface HermesMemoryLimits {
  memory: number;
  user: number;
  memory_enabled: boolean;
  user_enabled: boolean;
}

/**
 * 获取 Hermes 配置目录
 */
export async function getHermesDir(): Promise<string> {
  return invoke("viewer_get_hermes_dir");
}

/**
 * 获取 Hermes 目录树
 * @param depth 目录深度，默认3层
 */
export async function getHermesDirTree(depth?: number): Promise<FileNode> {
  return invoke("viewer_get_hermes_dir_tree", { depth });
}

/**
 * 读取文件内容
 */
export async function readHermesFile(path: string): Promise<string> {
  return invoke("viewer_hermes_read_file", { path });
}

/**
 * 获取 Hermes config.yaml 并返回 JSON 格式
 */
export async function getHermesConfig(): Promise<any> {
  return invoke("viewer_get_hermes_config");
}

/**
 * 获取 Hermes MCP 服务器配置
 */
export async function getHermesMcpConfig(): Promise<any> {
  return invoke("viewer_get_hermes_mcp_config");
}

/**
 * 获取 Hermes 内存文件内容
 * @param kind 'memory' or 'user'
 */
export async function getHermesMemory(kind: string): Promise<string> {
  return invoke("viewer_get_hermes_memory", { kind });
}

/**
 * 写入 Hermes 内存文件
 * @param kind 'memory' or 'user'
 * @param content 文件内容
 */
export async function writeHermesMemory(kind: string, content: string): Promise<void> {
  return invoke("viewer_write_hermes_memory", { kind, content });
}

/**
 * 获取 Hermes 模型配置
 */
export async function getHermesModelConfig(): Promise<any> {
  return invoke("viewer_get_hermes_model_config");
}

/**
 * 获取 Hermes Memory Limits
 */
export async function getHermesMemoryLimits(): Promise<HermesMemoryLimits> {
  return invoke("viewer_get_hermes_memory_limits");
}

/**
 * 检测 Hermes 最新版本
 */
export async function checkHermesVersion(): Promise<GitHubRelease> {
  return invoke("viewer_check_hermes_version");
}
