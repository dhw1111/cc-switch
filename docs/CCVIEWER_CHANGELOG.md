# CC Viewer 开发文档

## 概述

CC Viewer 是基于 CC Switch 的二开版本，主要将品牌从 "CC Switch" 更换为 "CC Viewer"，并修复了 ccViewer 命令路径检测问题。

## 基本信息

- **原项目**: farion1231/cc-switch
- **用户 Fork**: dhw1111/cc-switch
- **产品名称**: CC Viewer
- **产品标识符**: com.ccviewer.desktop
- **Deep Link 协议**: ccviewer://

## Git 仓库配置

```
origin  = https://github.com/dhw1111/cc-switch.git (用户 Fork)
upstream = https://github.com/farion1231/cc-switch.git (官方)
```

### 常用 Git 命令

```bash
# 同步上游更新
git fetch upstream
git merge upstream/main
git push origin main

# 切换分支
git checkout main
git checkout ccviewer-dev
```

## 主要修改

### 1. 品牌重命名 (CC Switch → CC Viewer)

| 文件 | 修改内容 |
|------|----------|
| `src-tauri/tauri.conf.json` | productName → CC Viewer, identifier → com.ccviewer.desktop |
| `src-tauri/tauri.windows.conf.json` | window title → CC Viewer |
| `src-tauri/Info.plist` | URL scheme → ccviewer |
| `src/i18n/locales/{zh,en,ja}.json` | 所有 "CC Switch" → "CC Viewer" |
| `src/App.tsx` | GitHub 链接改为 farion1231/cc-viewer |
| `src/components/settings/AboutSection.tsx` | GitHub release 链接更新 |

### 2. 图标替换

所有图标已替换为新设计的眼睛+齿轮图标 (蓝紫色渐变)。

图标文件位于: `src-tauri/icons/`

生成工具: 使用 Python PIL 在虚拟环境中生成了 RGBA 格式 PNG，然后使用 macOS `iconutil` 转换为 icns。

### 3. ccViewer 命令路径修复

文件: `src-tauri/src/ccviewer/commands.rs`

**问题**: Tauri 应用内 `claude` 命令不在 PATH 中。

**解决方案**: 依次尝试:
1. `which claude` 从 PATH 获取路径
2. macOS 默认路径 `/opt/homebrew/bin/claude`
3. 通用 `claude` 命令

```rust
let claude_path = std::env::var("CLAUDE_PATH").unwrap_or_else(|_| {
    if let Ok(output) = std::process::Command::new("which").arg("claude").output() {
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !path.is_empty() && std::path::Path::new(&path).exists() {
            return path;
        }
    }
    if cfg!(target_os = "macos") {
        "/opt/homebrew/bin/claude".to_string()
    } else {
        "claude".to_string()
    }
});
```

### 4. GitHub MCP 配置

文件: `~/.claude/mcp.json` 和 `~/.claude.json`

已配置 GitHub MCP server 用于仓库操作。

## 目录结构

```
docs/
├── ccviewer-dev/          # CC Viewer 开发文档
├── superpowers/          # 超级能力相关文档
├── CCVIEWER_CHANGELOG.md # 本文件 - 变更记录
└── README.md             # 项目 README
```

## 分支说明

- **main**: 稳定分支，与 dhw1111/cc-switch main 同步
- **ccviewer-dev**: 开发分支，用于新功能开发

## 未来更新指南

### 从上游同步更新

1. 确保在 main 分支
2. Fetch upstream
3. Merge upstream/main
4. 解决冲突（如有）
5. 推送到 origin
6. 如有必要，cherry-pick 或 rebase ccviewer-dev

### 添加新功能

1. 从 main 创建新分支: `git checkout -b feature/xxx`
2. 开发完成后，合并到 ccviewer-dev 或 main
3. 推送到 origin

### 更新文档

当有新变更时，请更新本文档的"主要修改"部分。

## 相关链接

- 用户仓库: https://github.com/dhw1111/cc-switch
- 官方仓库: https://github.com/farion1231/cc-switch
- GitHub MCP: https://github.com/modelcontextprotocol/servers/tree/main/src/github

## 其他文档

- [架构与开发指南](./CCVIEWER_ARCHITECTURE.md) - 项目架构、开发流程、二开指南
