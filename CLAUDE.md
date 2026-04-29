# CC Viewer 项目指南

## 项目概述

CC Viewer 是一个基于 Tauri 2 的桌面应用，用于查看和管理 Claude Code、Codex、Hermes、OpenCode 的配置文件。

### 技术栈

- **框架**: Tauri 2 (Rust + React + TypeScript)
- **前端**: React 18 + Vite + Tailwind CSS + Radix UI
- **后端**: Rust
- **状态管理**: React Context + React Query
- **国际化**: i18next

## 项目结构

```
cc-switch/
├── src/                          # React 前端源码
│   ├── App.tsx                   # 主应用入口，包含路由和状态管理
│   ├── components/               # React 组件
│   │   ├── ccviewer/            # CC Viewer 页面组件
│   │   │   ├── CcViewerPage.tsx  # 主页面 (支持多应用切换)
│   │   │   └── CommandLearning.tsx
│   │   └── ...
│   ├── contexts/                 # React Context
│   ├── lib/                      # 工具库和 API
│   │   └── api/
│   │       ├── ccviewer/         # Claude Code API
│   │       └── viewer/           # 多应用查看器 API
│   │           ├── hermes.ts
│   │           ├── opencode.ts
│   │           └── codex.ts
│   └── i18n/                     # 国际化
│
├── src-tauri/                    # Rust 后端源码
│   ├── src/
│   │   ├── lib.rs                # Tauri 入口和命令注册
│   │   ├── viewer/               # 查看器模块
│   │   │   ├── mod.rs
│   │   │   ├── shared.rs         # 共享类型
│   │   │   ├── hermes/          # Hermes 查看命令
│   │   │   ├── opencode/        # OpenCode 查看命令
│   │   │   └── codex/            # Codex 查看命令
│   │   └── ccviewer/             # 原有 Claude Code 查看命令
│   └── tauri.conf.json
│
└── docs/                         # 文档
    ├── CCVIEWER_ARCHITECTURE.md  # 架构指南
    └── CCVIEWER_CHANGELOG.md     # 变更日志
```

## 快速开始

### 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm tauri dev

# 生产构建
pnpm tauri build
```

### 安装

```bash
rm -rf /Applications/ccViewer.app
cp -R src-tauri/target/release/bundle/macos/ccViewer.app /Applications/
```

## CC Viewer 功能

CC Viewer 支持查看多个应用的配置：

| 应用 | 配置目录 | 主要功能 |
|------|----------|----------|
| Claude Code | `~/.claude/` | 目录树、Settings、MCP、Skills、Plugins、命令执行 |
| Hermes | `~/.hermes/` | 目录树、config.yaml、MCP servers、Memory files |
| OpenCode | `~/.opencode/` | 目录树、MCP 配置 |
| Codex | `~/.codex/` | 目录树、MCP 配置、Sessions |

### 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| Q/W/E/R | 切换应用 (Claude/Hermes/OpenCode/Codex) |
| 1-7 | 切换标签页 |
| R | 刷新 |
| ? | 显示帮助 |

## 添加新命令

### Rust 后端

1. 在 `src-tauri/src/viewer/[app]/commands.rs` 添加函数
2. 使用 `#[tauri::command]` 装饰
3. 在 `src-tauri/src/lib.rs` 注册命令

```rust
// src-tauri/src/viewer/hermes/commands.rs
#[tauri::command]
pub fn viewer_get_hermes_something() -> Result<String, String> {
    // 实现...
}
```

```rust
// src-tauri/src/lib.rs
viewer::hermes::commands::viewer_get_hermes_something,
```

### 前端 API

1. 在 `src/lib/api/viewer/[app].ts` 添加函数

```typescript
// src/lib/api/viewer/hermes.ts
export async function getHermesSomething(): Promise<string> {
  return invoke("viewer_get_hermes_something");
}
```

### 前端组件

在 `src/components/ccviewer/CcViewerPage.tsx` 的 TabContent 中添加对应的 Tab 面板。

## 架构决策

### 多应用查看器设计

- 使用 `activeApp` 状态区分当前查看的应用
- 各 Tab 组件通过 props 接收 `appId` 和 `appDir`
- API 层按应用分离到不同的模块

### Rust 模块组织

- `viewer/` 模块包含所有查看器相关的 Rust 代码
- 每个应用有独立的子模块 (hermes/opencode/codex)
- 共享类型放在 `viewer/shared.rs`

## 相关资源

- [Tauri 2 文档](https://v2.tauri.app/)
- [React 文档](https://react.dev/)
- [Rust 文档](https://doc.rust-lang.org/)
