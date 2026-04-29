# CC Viewer 项目架构与开发指南

## 一、项目概述

CC Viewer 是基于 CC Switch 的桌面应用二开项目，使用 Tauri 2 (Rust + React) 构建。

### 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Tauri 2 |
| 后端 | Rust |
| 前端 | React + TypeScript + Vite |
| 样式 | Tailwind CSS |
| 状态管理 | React Context + React Query |
| 国际化 | i18next |
| UI 组件 | Radix UI |

### 目录结构

```
cc-switch/
├── src/                          # React 前端源码
│   ├── App.tsx                   # 主应用入口
│   ├── components/               # React 组件
│   │   ├── settings/             # 设置页面组件
│   │   ├── ccviewer/             # CC Viewer 页面组件
│   │   └── ...
│   ├── contexts/                 # React Context
│   ├── lib/                      # 工具库和 API
│   │   └── api/                  # API 调用模块
│   ├── config/                   # 配置文件
│   ├── i18n/                     # 国际化
│   │   └── locales/              # 语言文件 (zh/en/ja)
│   └── assets/                   # 静态资源
│
├── src-tauri/                    # Rust 后端源码
│   ├── src/
│   │   ├── lib.rs                # Tauri 入口
│   │   ├── commands/             # Tauri 命令
│   │   │   ├── hermes.rs
│   │   │   └── misc.rs
│   │   ├── ccviewer/              # CC Viewer 模块 (新添加)
│   │   │   ├── mod.rs
│   │   │   └── commands.rs
│   │   ├── deeplink/              # Deep link 处理
│   │   ├── mcp/                  # MCP 相关
│   │   ├── proxy/                 # 代理相关
│   │   ├── services/             # 服务层
│   │   └── database/              # 数据库
│   ├── icons/                    # 应用图标
│   ├── tauri.conf.json           # Tauri 配置
│   └── capabilities/             # 权限配置
│
├── docs/                         # 文档
│   ├── CCVIEWER_ARCHITECTURE.md  # 本文档
│   ├── CCVIEWER_CHANGELOG.md     # 变更日志
│   └── ccviewer-dev/             # 开发笔记
│
└── package.json                  # Node 依赖
```

## 二、关键模块说明

### 2.1 前端核心模块

#### App.tsx
- 主应用入口
- 路由配置
- 全局状态 Provider 组合

#### components/ccviewer/
- **CcViewerPage.tsx**: CC Viewer 主页面
- **CommandLearning.tsx**: Claude 命令学习功能

#### lib/api/
- `hermes.ts`: Hermes API 调用
- `deeplink.ts`: Deep link 处理
- `ccviewer/index.ts`: CC Viewer API 调用 (新添加)

### 2.2 后端核心模块 (Rust)

#### ccviewer/commands.rs
核心命令实现：

| 命令 | 功能 |
|------|------|
| `get_claude_dir` | 获取 Claude 配置目录 |
| `get_claude_dir_tree` | 获取目录树结构 |
| `read_file_content` | 读取文件内容 |
| `read_json_file` | 读取 JSON 配置 |
| `execute_claude_command` | 执行 Claude Code 命令 |
| `get_claude_version` | 获取 Claude 版本 |
| `get_claude_skills` | 获取技能列表 |
| `get_claude_plugins` | 获取插件列表 |
| `ccviewer_get_mcp_config` | 获取 MCP 配置 |
| `check_claude_latest_version` | 检测最新版本 |

#### deeplink/
Deep link 协议处理 (`ccviewer://`)

#### mcp/
Model Context Protocol 相关实现

## 三、品牌二开指南

### 3.1 品牌修改清单

如果要从 CC Viewer 再次二开为其他品牌，修改以下文件：

| 文件 | 修改内容 |
|------|----------|
| `src-tauri/tauri.conf.json` | productName, identifier |
| `src-tauri/tauri.windows.conf.json` | window title |
| `src-tauri/Info.plist` | CFBundleURLScheme |
| `src/i18n/locales/*.json` | 所有品牌相关文案 |
| `src/App.tsx` | GitHub 链接 |
| `src/components/settings/AboutSection.tsx` | 关于页信息 |
| `src-tauri/icons/*` | 所有图标文件 |
| `docs/CCVIEWER_CHANGELOG.md` | 文档重命名 |

### 3.2 模块改名清单

如果要将 ccviewer 模块改名为其他名称：

| 位置 | 修改内容 |
|------|----------|
| `src-tauri/src/ccviewer/` | 目录重命名 |
| `src-tauri/src/lib.rs` | mod 声明 |
| `src-tauri/src/commands/` | 相关命令文件 |

## 四、使用 Claude Code 开发

### 4.1 日常开发流程

```bash
# 1. 同步上游最新代码
git fetch upstream
git merge upstream/main

# 2. 创建功能分支
git checkout -b feature/功能名称

# 3. 开发调试
pnpm tauri dev

# 4. 提交变更
git add .
git commit -m "描述"

# 5. 推送到 Fork
git push origin feature/功能名称

# 6. 在 GitHub 创建 PR
```

### 4.2 Claude Code 协作指令

以下是推荐使用的指令：

| 指令 | 用途 |
|------|------|
| `/review-pr` | 审查 PR |
| `/test` | 运行测试 |
| `/search` | 搜索代码 |
| `/explain` | 解释代码 |
| `/fix` | 修复 Bug |

### 4.3 开发约定

1. **提交信息格式**:
   ```
   type(scope): description
   
   - 具体变更点
   - Another change
   
   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   ```

2. **Type 类型**:
   - `feat`: 新功能
   - `fix`: 修复
   - `docs`: 文档
   - `refactor`: 重构
   - `style`: 格式调整
   - `test`: 测试
   - `chore`: 构建/工具

3. **分支命名**:
   - `feature/功能名`: 新功能
   - `fix/bug描述`: 修复
   - `refactor/模块名`: 重构
   - `docs/文档类型`: 文档

## 五、架构决策记录

### 5.1 为什么这样二开？

1. **保持模块独立**: 将 CC Viewer 相关代码放在独立的 `ccviewer/` 目录下，便于后续合并回上游或继续二开
2. **命令路径检测**: 修复了 Tauri 应用内无法找到 `claude` 命令的问题
3. **保留上游兼容**: 所有修改不破坏原有功能，便于同步上游更新

### 5.2 未来可能的走向

1. **继续二开方向**:
   - 添加更多 CC Viewer 专属功能
   - 优化 ccViewer 命令执行体验
   - 增加本地 Claude Code 配置管理功能

2. **合并回上游**:
   - 如果官方接受 PR，可以将通用功能合并
   - 保持 fork 同步，跟随上游更新

3. **完全独立**:
   - 重命名所有标识，建立独立品牌
   - 申请独立的应用商店上架

## 六、常见问题

### Q: 如何调试 Rust 代码？
```bash
# 在 src-tauri 目录下
cargo build --verbose
cargo test
RUST_LOG=debug pnpm tauri dev
```

### Q: 如何查看 Tauri 日志？
```bash
# macOS
tail -f ~/Library/Logs/com.ccviewer.desktop.log

# Windows
type %APPDATA%\CCViewer\logs\*.log
```

### Q: 如何添加新的 Tauri 命令？
1. 在 `src-tauri/src/ccviewer/commands.rs` 添加函数
2. 使用 `#[tauri::command]` 装饰
3. 在 `src-tauri/src/lib.rs` 注册命令
4. 在前端 `lib/api/ccviewer/index.ts` 添加调用

## 七、相关资源

- [Tauri 2 文档](https://v2.tauri.app/)
- [React + TypeScript 最佳实践](https://react.dev/learn)
- [Rust 程序设计语言](https://doc.rust-lang.org/book/)
