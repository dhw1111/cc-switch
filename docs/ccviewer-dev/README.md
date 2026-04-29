# CC Viewer 开发文档

> 本文档记录 CC Viewer 的开发环境、构建流程和重要决策，防止上下文丢失后丢失关键信息。

## 应用信息

| 项目 | 值 |
|------|-----|
| 应用名称 | CC Viewer |
| 包标识符 | com.ccviewer.desktop |
| 窗口标题 | CC Viewer |
| 当前版本 | 1.0.0 |
| 协议 | ccviewer:// |

## 源码位置

- 前端: `/Users/dhw/GolandProjects/cc-switch/src/`
- 后端 (Rust): `/Users/dhw/GolandProjects/cc-switch/src-tauri/src/`
- 图标: `/Users/dhw/GolandProjects/cc-switch/src-tauri/icons/`

## 构建命令

```bash
# 开发模式
cd /Users/dhw/GolandProjects/cc-switch
pnpm tauri dev

# 生产构建
pnpm tauri build

# 安装到本地 Applications
rm -rf /Applications/ccViewer.app
cp -R src-tauri/target/release/bundle/macos/ccViewer.app /Applications/
```

## 品牌重命名记录

### 原始项目 (CC Switch)
- 产品名: CC Switch
- 标识符: com.ccswitch.desktop / com.ccswitch.ccviewer
- 协议: ccswitch://
- GitHub: github.com/farion1231/cc-switch

### 重命名为 CC Viewer (2026-04-28)
- 产品名: CC Viewer
- 标识符: com.ccviewer.desktop
- 协议: ccviewer://
- GitHub: github.com/farion1231/cc-viewer

### 已修改的文件

**配置文件:**
- `src-tauri/tauri.conf.json` - productName, identifier, window title, updater removed
- `src-tauri/Info.plist` - URL scheme ccviewer
- `src-tauri/tauri.windows.conf.json` - window title
- `src-tauri/capabilities/default.json` - (如需要)

**i18n 文件 (3个语言):**
- `src/i18n/locales/zh.json`
- `src/i18n/locales/en.json`
- `src/i18n/locales/ja.json`

**前端代码:**
- `src/App.tsx` - GitHub 链接, 品牌文字
- `src/components/settings/AboutSection.tsx` - GitHub 链接
- `src/components/settings/DirectorySettings.tsx` - 注释
- `src/contexts/UpdateContext.tsx` - localStorage key
- `src/lib/api/deeplink.ts` - 注释
- `src/lib/api/hermes.ts` - 注释
- `src/config/claudeProviderPresets.ts` - (保留第三方链接)
- `src/config/hermesProviderPresets.ts` - 注释
- `src/config/codexProviderPresets.ts` - (保留第三方链接)

**Rust 代码:**
- 所有 `src-tauri/src/` 下的 .rs 文件中的 CC Switch 字符串替换为 CC Viewer
- `src-tauri/src/lib.rs` - 深度链接处理
- `src-tauri/src/auto_launch.rs` - 应用名
- `src-tauri/src/commands/misc.rs` - GitHub URL
- `src-tauri/src/database/backup.rs` - 导出文件头
- `src-tauri/src/deeplink/` - 协议相关
- `src-tauri/src/mcp/` - 注释
- `src-tauri/src/proxy/` - 注释
- `src-tauri/src/services/` - 注释

## 图标生成

图标源文件: `src-tauri/icons/icon_preview1.jpeg` (1024x1024)

生成 RGBA PNG 格式的流程:
```bash
# 1. 创建 Python 虚拟环境
python3 -m venv /tmp/icon_venv
/tmp/icon_venv/bin/pip install Pillow

# 2. 使用 Pillow 生成所有尺寸的 PNG
/tmp/icon_venv/bin/python3 << 'EOF'
from PIL import Image
import os

src = Image.open("src-tauri/icons/icon_preview1.jpeg").convert("RGBA")

# 主图标
for size, name in [(32,"32x32.png"), (64,"64x64.png"), (128,"128x128.png"),
                   (256,"128x128@2x.png"), (512,"icon.png")]:
    src.resize((size, size), Image.LANCZOS).save(f"src-tauri/icons/{name}", "PNG")

# Windows Store 图标
for size, name in [(16,"Square30x30Logo.png"), (44,"Square44x44Logo.png"),
                   (71,"Square71x71Logo.png"), (107,"Square107x107Logo.png"),
                   (142,"Square142x142Logo.png"), (150,"Square150x150Logo.png"),
                   (284,"Square284x284Logo.png"), (310,"Square310x310Logo.png"),
                   (50,"StoreLogo.png"), (89,"Square89x89Logo.png")]:
    src.resize((size, size), Image.LANCZOS).save(f"src-tauri/icons/{name}", "PNG")

# iconset for icns
os.makedirs("src-tauri/icons/icon.iconset", exist_ok=True)
for size, name in [(16,"16x16"), (32,"16x16@2x"), (32,"32x32"), (64,"32x32@2x"),
                   (128,"128x128"), (256,"128x128@2x"), (512,"512x512"), (1024,"512x512@2x")]:
    src.resize((size, size), Image.LANCZOS).save(f"src-tauri/icons/icon.iconset/icon_{name}.png", "PNG")
EOF

# 3. 生成 icns
iconutil -c icns src-tauri/icons/icon.iconset -o src-tauri/icons/icon.icns

# 4. 生成 ico (需要 png-to-ico npm 包)
npm install -g png-to-ico
/tmp/icon_venv/bin/python3 -c "from PIL import Image; Image.open('src-tauri/icons/icon_preview1.jpeg').convert('RGBA').resize((256,256), Image.LANCZOS).save('/tmp/256.png')"
png-to-ico /tmp/256.png > src-tauri/icons/icon.ico

# 5. 更新 app-icon.png
sips -s format png --out src/assets/icons/app-icon.png src-tauri/icons/icon.png
```

## ccViewer 功能模块

ccViewer 是 CC Switch 的一个视图页面，用于查看 Claude Code 配置。

### 文件结构

```
src/
├── components/ccviewer/
│   ├── CcViewerPage.tsx    # 主页面 (7个标签页: 目录树/Settings/MCP/Skills/Plugins/命令执行/命令学习)
│   └── CommandLearning.tsx  # 命令学习模块
└── lib/api/ccviewer/
    └── index.ts            # API 调用封装

src-tauri/src/
└── ccviewer/
    ├── mod.rs               # 模块定义
    └── commands.rs          # Tauri 命令 (12个)

```

### Tauri 命令列表

| 命令 | 功能 |
|------|------|
| get_claude_dir | 获取 Claude Code 配置目录 |
| get_claude_dir_tree | 获取目录树 |
| read_file_content | 读取文件内容 |
| read_json_file | 读取 JSON 文件 |
| execute_claude_command | 执行 Claude 命令 |
| get_claude_version | 获取版本 |
| get_claude_skills | 获取 Skills 列表 |
| get_claude_plugins | 获取 Plugins 列表 |
| ccviewer_get_mcp_config | 获取 MCP 配置 |
| get_settings_config | 获取 settings.json |
| get_settings_local_config | 获取 settings.local.json |
| check_claude_latest_version | 检测最新版本 |

## 重要笔记

1. **图标格式**: Tauri 要求所有图标为 RGBA 格式，使用 sips 生成的可能不是 RGBA
2. **标识符**: 避免以 `.app` 结尾，会与 macOS 应用包冲突
3. **深度链接**: 虽然用户不需要导入功能，但协议已从 ccswitch:// 改为 ccviewer://
4. **第三方链接**: 部分预设中的 short.gy 链接保留，不影响品牌

## 下次开发前检查

1. 运行 `git status` 查看当前状态
2. 检查 docs/ccviewer-dev/README.md 是否存在
3. 阅读本文档了解已完成的更改