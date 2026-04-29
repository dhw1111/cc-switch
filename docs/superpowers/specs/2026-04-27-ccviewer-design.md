# ccViewer 设计文档

## 概述

**项目名**: ccViewer（ccSwitch 分支）
**基于**: ccSwitch 3.14.1
**定位**: ccSwitch 的 Claude Code 增强视图，专注配置文件、Skills、MCP、Plugins 的完整查看与分析

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS（复用 ccSwitch）
- **后端**: Rust + Tauri
- **存储**: 复用 ccSwitch 的 `~/.cc-switch/` 目录和 SQLite 数据库
- **桌面**: Tauri 跨平台桌面应用

## 核心功能

### 1. Claude Code 配置视图（新增）

在 ccSwitch 左侧导航新增 **"Claude Code"** 主菜单，下设子菜单：

| 子菜单 | 功能 |
|--------|------|
| **配置文件** | 展示 `~/.claude/` 完整目录树，可展开查看任意文件 |
| **Settings** | 解析 `settings.json`，展示所有配置项 |
| **MCP** | 解析 `mcp.json`，展示 MCP servers 列表和状态 |
| **Skills** | 展示 `skills/` 目录下所有 skills（内置 + 自定义） |
| **Plugins** | 展示 `plugins/` 目录下所有 plugins |
| **环境变量** | 展示 `.claude/settings.local.json` 中的 env 配置 |

### 2. 命令面板（新增）

- 类似 VS Code `Ctrl+Shift+P` 快捷键调出
- 支持模糊搜索命令
- **只读命令**：执行 `claude --version`、`claude --info`、`claude models list` 等获取信息
- 命令输出结果展示在界面中
- 保存命令执行历史

### 3. 命令学习面板（新增）

- 集成不同版本 Claude Code 的命令作为参考手册
- 按功能分类展示
- 支持版本对比
- 可复制命令到剪贴板

### 4. 版本检测（新增）

- 启动时检测 Claude Code 当前版本
- 通过 GitHub API 查询最新 release 版本
- 界面提示有新版本可用

## 界面模式

- **只读模式**：ccViewer 专注分析查看，不允许编辑配置
- **编辑仍用 ccSwitch 原生界面**：需要修改配置时切换回 ccSwitch

## 目录结构（新增）

```
src/
├── components/
│   └── ccviewer/           # 新增 ccViewer 组件
│       ├── ConfigTree.tsx   # 配置目录树
│       ├── SettingsView.tsx # Settings 查看器
│       ├── McpView.tsx      # MCP 查看器
│       ├── SkillsView.tsx   # Skills 查看器
│       ├── PluginsView.tsx  # Plugins 查看器
│       ├── CommandPalette.tsx # 命令面板
│       └── CommandLearning.tsx # 命令学习面板
src-tauri/
└── src/
    └── ccviewer/           # 新增 ccViewer Rust 命令
        ├── commands.rs      # Tauri 命令定义
        └── parser.rs        # 配置文件解析
```

## 数据流

```
用户操作 → React 组件 → Tauri Command (RPC) → Rust 后端 → 文件系统/命令执行 → 返回 JSON → 界面展示
```

## 第一阶段实现步骤

1. 创建 ccViewer 组件目录结构
2. 实现配置目录树组件
3. 实现 Settings 查看器
4. 实现 MCP 查看器
5. 实现 Skills 查看器
6. 实现 Plugins 查看器
7. 实现命令面板
8. 实现命令学习面板
9. 实现版本检测
10. UI 集成到 ccSwitch 主界面

## 约束

- 不修改 ccSwitch 现有功能
- ccViewer 所有新增功能默认只读
- 兼容 ccSwitch 后续版本更新
