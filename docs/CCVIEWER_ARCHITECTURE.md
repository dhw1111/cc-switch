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

本项目是 Tauri 2 桌面应用，涉及 Rust 后端和 React 前端。Claude Code 能大幅提升开发效率，关键在于正确的使用方式。

### 4.1 Claude Code 工作原理

Claude Code 通过读取项目文件理解代码结构，通过工具（搜索、读取、编辑、终端）执行操作。它有记忆系统，能跨会话记住项目上下文。

**核心能力**:
- 搜索和理解代码库
- 读取、创建、修改文件
- 执行终端命令
- 理解项目架构和约定

**局限性**:
- 不擅长长时间连续对话（会遗忘）
- 不自动知道你的意图（需要明确指示）
- 不会自动保存你的反馈

### 4.2 正确的提问方式

#### ❌ 差的做法
```
帮我看看这个bug
添加登录功能
优化一下代码
```

#### ✅ 好的做法

**报告 Bug**:
```
在 src/components/settings/DirectorySettings.tsx 中，切换目录时控制台报错:
TypeError: Cannot read property 'path' of undefined

我已经检查过 props.dir 是 undefined，但不知道为什么会这样。
相关文件: DirectorySettings.tsx, lib/api/ccviewer/index.ts
```

**请求新功能**:
```
我想在 CC Viewer 页面添加一个"最近使用的命令"列表。
要求:
1. 显示最近 10 条执行的命令
2. 支持点击重新执行
3. 数据保存在 localStorage
4. UI 样式与现有列表保持一致

相关文件: components/ccviewer/CcViewerPage.tsx
```

**代码优化**:
```
src-tauri/src/ccviewer/commands.rs 中的 execute_claude_command 函数太长了。
请帮我:
1. 提取子函数，每个负责一部分逻辑
2. 添加单元测试
3. 保持原有的错误处理逻辑

不要改变函数签名和外部行为。
```

**架构变更**:
```
我需要在 src-tauri/src/services/ 下新增一个 provider 服务模块。
要求:
1. 创建 services/provider/mod.rs 作为模块入口
2. 实现 Provider trait 和 Live 实现
3. 参考现有的 hermes.rs 和 services/skill.rs 的结构
4. 在 lib.rs 中正确注册

请先让我确认架构设计再开始写代码。
```

### 4.3 任务分解策略

复杂任务不要一次性交给 Claude Code，要分步执行:

#### 步骤 1: 调研和确认
```
先帮我理解现有的 provider 服务是如何设计的。
查看 src-tauri/src/services/ 目录，告诉我:
1. 现有的服务结构和 trait 设计
2. Provider trait 有哪些方法
3. Live 实现是怎么注册到 Tauri 的
```

#### 步骤 2: 方案设计
```
基于你的理解，我想新增一个 ClaudeProvider。
请给出:
1. 文件结构
2. trait 定义
3. 实现要点

我确认后再开始写代码。
```

#### 步骤 3: 逐步实现
```
好，现在开始实现。按照刚才的方案:
1. 先创建 mod.rs
2. 添加 trait 定义
3. 实现 Live 结构

每完成一步我会确认。
```

#### 步骤 4: 集成测试
```
现在帮我:
1. 在 lib.rs 中注册新模块
2. 添加一个 Tauri 命令来调用它
3. 在前端添加 API 调用

构建和测试的命令是: pnpm tauri dev
```

### 4.4 高效工作流

#### 日常开发会话

```bash
# 1. 开始前，同步上游代码
git fetch upstream

# 2. 进入项目目录
cd /Users/dhw/GolandProjects/cc-switch

# 3. 开始 Claude Code 会话
claude

# 4. 会话开始时，告诉 Claude 当前任务
# 例如:
# "帮我添加一个功能: 显示 Claude Code 配置目录的使用统计"
# "我会先说明需求，你来设计方案，确认后实现"
```

#### 多会话任务管理

长时间任务需要分解到多个会话:

```bash
# Session 1: 设计和初始化
"我想重构整个命令执行模块。
第一阶段: 调研现有代码，设计新的架构。
只做调研和设计，不要写代码。"

# Session 2-4: 逐步实现
"继续上一会话的方案。现在实现第一部分: trait 定义。"
"继续。实现第二部分: 错误处理层。"
"继续。实现第三部分: 与现有代码集成。"

# Session 5: 测试和修复
"运行 pnpm tauri dev 测试，发现问题在 XX 行..."
```

#### 使用 Memory 记住上下文

在 `~/.claude/projects/-Users-dhw-GolandProjects-cc-switch/memory/` 中保存重要决策:

```markdown
# 架构决策: Provider 模块设计
date: 2026-04-29

## 决策
ClaudeProvider 使用单例模式，通过 Arc<RwLock<State>> 共享状态。

## 为什么
因为命令执行需要维护上下文状态，但又不能每次都创建新实例。

## 替代方案
- DI 容器: 太重
- 全局变量: 不安全
```

### 4.5 Claude Code 指令参考

#### Slash Commands

| 指令 | 用途 | 示例 |
|------|------|------|
| `/clear` | 清空当前会话，重新开始 | `/clear` |
| `/help` | 显示帮助 | `/help` |
| `/commit` | 提交当前更改 | `/commit` |
| `/review-pr <url>` | 审查 PR | `/review-pr https://github.com/...` |
| `/test` | 运行测试 | `/test` |
| `/search <query>` | 搜索代码 | `/search execute_claude_command` |
| `/web-search <query>` | 网络搜索 | `/web-search tauri 2 rust spawn` |

#### 高效提示词模板

**理解代码**:
```
解释 src-tauri/src/commands/hermes.rs 中 execute_hermes_command 函数的逻辑。
重点关注:
1. 它如何处理命令参数
2. 错误如何传播
3. 与其他模块的交互
```

**写测试**:
```
为 src-tauri/src/ccviewer/commands.rs 中的 get_claude_version 函数编写单元测试。
要求:
1. 使用 mock 模拟 claude 命令输出
2. 测试成功和失败场景
3. 参考现有的测试模式（在同文件或 tests/ 目录）
```

**代码审查**:
```
审查 src-tauri/src/proxy/providers/claude.rs。
重点检查:
1. 错误处理是否完善
2. 是否有潜在的并发安全问题
3. 资源是否正确释放
```

**重构代码**:
```
重构 lib/api/hermes.ts，使其:
1. 使用 async/await 替代 .then() 链
2. 添加 TypeScript 类型注解
3. 统一错误处理方式

参考: lib/api/ccviewer/index.ts 的实现风格
```

**添加功能**:
```
在 settings 页面添加一个"清除缓存"按钮。
要求:
1. 清除 localStorage 中的临时数据
2. 清除 Tauri 应用缓存目录
3. 点击后显示 toast 提示成功/失败
4. 使用 sonner 作为 toast 库（已安装）

相关文件: src/components/settings/DirectorySettings.tsx
```

**调试问题**:
```
pnpm tauri dev 运行时控制台报错:
Error: invoke 'ccviewer_get_mcp_config' failed: MCP config file not found

但文件存在于 ~/.claude/mcp.json。
帮我排查:
1. Tauri 命令是如何拼接路径的
2. 是否是权限问题
3. 是否有缓存问题
```

### 4.6 开发约定

#### 提交信息格式

```
type(scope): 简短描述

详细说明（如果需要）:
- 变更点 1
- 变更点 2

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

#### Type 类型

| Type | 用途 | 示例 |
|------|------|------|
| feat | 新功能 | `feat(ccviewer): add command history display` |
| fix | 修复 | `fix(commands): handle empty path in get_claude_dir` |
| docs | 文档 | `docs: add architecture guide` |
| refactor | 重构 | `refactor(hermes): extract error handling` |
| style | 格式 | `style: format code with prettier` |
| test | 测试 | `test(commands): add mock for claude version` |
| chore | 构建/工具 | `chore: update dependencies` |

#### 分支命名

```
feature/ccviewer-command-history     # 新功能
feature/settings-cache-clear
fix/claude-path-detection            # Bug 修复
refactor/provider-service            # 重构
docs/architecture-guide             # 文档
```

### 4.7 项目特定的工作约定

#### Rust 代码

```rust
// 1. 错误处理使用 thiserror
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CommandError {
    #[error("Claude not found: {0}")]
    NotFound(String),
    #[error("Command failed: {0}")]
    ExecutionFailed(String),
}

// 2. 异步函数使用 anyhow 做错误聚合
async fn execute() -> anyhow::Result<String> {
    // ...
}

// 3. 公开函数必须有文档注释
/// Execute a Claude Code command and return the output.
///
/// # Errors
/// Returns `CommandError::NotFound` if claude binary is not found.
/// Returns `CommandError::ExecutionFailed` if command exits with non-zero code.
pub async fn execute_claude_command(args: Vec<String>) -> Result<String, CommandError> {
    // ...
}
```

#### React/TypeScript 代码

```typescript
// 1. 组件使用函数式组件 + hooks
export function CcViewerPage() {
  const [commands, setCommands] = useState<Command[]>([]);

  // 2. API 调用统一封装在 lib/api/
  const handleExecute = async (cmd: string) => {
    try {
      const result = await ccviewerApi.executeCommand([cmd]);
      // ...
    } catch (error) {
      // 统一错误处理
    }
  };
}

// 3. Props 使用 interface
interface CcViewerPageProps {
  onCommandExecuted?: (cmd: string) => void;
}
```

#### 文件组织

```
每次新增功能时:
1. 后端: src-tauri/src/[模块]/ 目录下添加文件
2. 前端: src/lib/api/[模块]/ 目录下添加 API
3. 前端: src/components/[模块]/ 目录下添加组件
4. 文档: 更新 docs/CCVIEWER_CHANGELOG.md
```

### 4.8 当 Claude Code 表现不佳时

| 问题 | 解决方法 |
|------|----------|
| 遗忘上下文 | 使用 `/clear` 重置，明确告诉它已完成的步骤 |
| 方向错误 | 明确说"停"，重新描述需求 |
| 代码有 bug | 粘贴具体错误信息，指出问题所在 |
| 过度设计 | 说"只需要基本实现，不要过度设计" |
| 不读你的反馈 | 直接编辑文件或使用 `/clear` |
| 忘记项目约定 | 引用文档中的具体规定 |

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
