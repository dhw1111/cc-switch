import { useState, useMemo } from "react";
import { Search, Copy, Check, Terminal, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Claude Code 命令学习面板
 * 集成不同版本的命令作为参考手册
 */

interface Command {
  cmd: string;
  description: string;
  category: string;
  version?: string;
}

interface CommandCategory {
  name: string;
  commands: Command[];
}

// Claude Code 命令数据库（持续更新）
const COMMAND_DATABASE: CommandCategory[] = [
  {
    name: "基础信息",
    commands: [
      { cmd: "claude --version", description: "显示 Claude Code 当前版本", category: "基础信息" },
      { cmd: "claude --help", description: "显示帮助信息", category: "基础信息" },
      { cmd: "claude --info", description: "显示 Claude 详细信息", category: "基础信息" },
      { cmd: "claude status", description: "显示当前状态", category: "基础信息" },
    ],
  },
  {
    name: "会话管理",
    commands: [
      { cmd: "claude sessions list", description: "列出所有会话", category: "会话管理" },
      { cmd: "claude sessions new", description: "创建新会话", category: "会话管理" },
      { cmd: "claude sessions switch <id>", description: "切换到指定会话", category: "会话管理" },
      { cmd: "claude sessions delete <id>", description: "删除指定会话", category: "会话管理" },
      { cmd: "claude sessions clear", description: "清除当前会话", category: "会话管理" },
    ],
  },
  {
    name: "模型操作",
    commands: [
      { cmd: "claude models list", description: "列出可用模型", category: "模型操作" },
      { cmd: "claude models current", description: "显示当前模型", category: "模型操作" },
      { cmd: "claude models set <model>", description: "设置当前模型", category: "模型操作" },
    ],
  },
  {
    name: "配置管理",
    commands: [
      { cmd: "claude config set <key> <value>", description: "设置配置项", category: "配置管理" },
      { cmd: "claude config get <key>", description: "获取配置项", category: "配置管理" },
      { cmd: "claude config list", description: "列出所有配置", category: "配置管理" },
      { cmd: "claude config reset", description: "重置配置", category: "配置管理" },
    ],
  },
  {
    name: "Skills 管理",
    commands: [
      { cmd: "claude skills list", description: "列出已安装的 Skills", category: "Skills" },
      { cmd: "claude skills add <repo>", description: "添加 Skill", category: "Skills" },
      { cmd: "claude skills remove <name>", description: "移除 Skill", category: "Skills" },
      { cmd: "claude skills update", description: "更新所有 Skills", category: "Skills" },
      { cmd: "claude skills search <query>", description: "搜索 Skills", category: "Skills" },
    ],
  },
  {
    name: "MCP 管理",
    commands: [
      { cmd: "claude mcp list", description: "列出 MCP 服务器", category: "MCP" },
      { cmd: "claude mcp add <server>", description: "添加 MCP 服务器", category: "MCP" },
      { cmd: "claude mcp remove <server>", description: "移除 MCP 服务器", category: "MCP" },
      { cmd: "claude mcp status", description: "显示 MCP 状态", category: "MCP" },
    ],
  },
  {
    name: "Plugins 管理",
    commands: [
      { cmd: "claude plugins list", description: "列出已安装插件", category: "Plugins" },
      { cmd: "claude plugins enable <name>", description: "启用插件", category: "Plugins" },
      { cmd: "claude plugins disable <name>", description: "禁用插件", category: "Plugins" },
      { cmd: "claude plugins install <url>", description: "安装插件", category: "Plugins" },
      { cmd: "claude plugins uninstall <name>", description: "卸载插件", category: "Plugins" },
    ],
  },
  {
    name: "工作目录",
    commands: [
      { cmd: "claude diff", description: "显示当前更改", category: "工作目录" },
      { cmd: "claude commit", description: "提交更改", category: "工作目录" },
      { cmd: "claude push", description: "推送到远程", category: "工作目录" },
      { cmd: "claude pull", description: "从远程拉取", category: "工作目录" },
      { cmd: "claude branch", description: "分支操作", category: "工作目录" },
    ],
  },
  {
    name: "任务执行",
    commands: [
      { cmd: "claude task <prompt>", description: "执行单个任务", category: "任务执行" },
      { cmd: "claude task --watch <prompt>", description: "监视模式执行任务", category: "任务执行" },
      { cmd: "claude plan", description: "显示计划", category: "任务执行" },
      { cmd: "claude execute", description: "执行计划", category: "任务执行" },
    ],
  },
  {
    name: "开发者选项",
    commands: [
      { cmd: "claude --verbose", description: "详细输出模式", category: "开发者选项" },
      { cmd: "claude --debug", description: "调试模式", category: "开发者选项" },
      { cmd: "claude --dry-run", description: "试运行模式", category: "开发者选项" },
      { cmd: "claude --no-input", description: "无输入模式", category: "开发者选项" },
      { cmd: "claude --print-output", description: "打印输出", category: "开发者选项" },
    ],
  },
  {
    name: "Beta 功能",
    commands: [
      { cmd: "claude beta enable <feature>", description: "启用 Beta 功能", category: "Beta" },
      { cmd: "claude beta disable <feature>", description: "禁用 Beta 功能", category: "Beta" },
      { cmd: "claude beta list", description: "列出 Beta 功能", category: "Beta" },
      { cmd: "claude experimental <cmd>", description: "实验性命令", category: "Beta" },
    ],
  },
  {
    name: "日志与调试",
    commands: [
      { cmd: "claude logs", description: "查看日志", category: "日志" },
      { cmd: "claude logs --tail <n>", description: "查看最后 N 行日志", category: "日志" },
      { cmd: "claude logs --clear", description: "清除日志", category: "日志" },
      { cmd: "claude debug <session>", description: "调试会话", category: "日志" },
    ],
  },
];

interface CommandLearningProps {
  onExecuteCommand?: (cmd: string) => void;
}

export function CommandLearning({ onExecuteCommand }: CommandLearningProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["基础信息"]));
  const [copiedCmd, setCopiedCmd] = useState<string>("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return COMMAND_DATABASE;

    const query = searchQuery.toLowerCase();
    return COMMAND_DATABASE.map((category) => ({
      ...category,
      commands: category.commands.filter(
        (cmd) =>
          cmd.cmd.toLowerCase().includes(query) ||
          cmd.description.toLowerCase().includes(query)
      ),
    })).filter((category) => category.commands.length > 0);
  }, [searchQuery]);

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(""), 2000);
  };

  const totalCommands = filteredCategories.reduce(
    (acc, cat) => acc + cat.commands.length,
    0
  );

  return (
    <div className="h-full flex flex-col">
      {/* 搜索栏 */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索命令..."
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          共 {totalCommands} 个命令
        </p>
      </div>

      {/* 命令列表 */}
      <div className="flex-1 overflow-auto">
        {filteredCategories.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            未找到匹配的命令
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.name} className="mb-2">
              {/* 分类标题 */}
              <button
                onClick={() => toggleCategory(category.name)}
                className="flex items-center gap-2 w-full px-3 py-2 bg-muted hover:bg-muted/70 rounded-lg text-left"
              >
                {expandedCategories.has(category.name) ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium">{category.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {category.commands.length}
                </span>
              </button>

              {/* 命令列表 */}
              {expandedCategories.has(category.name) && (
                <div className="mt-1 space-y-1">
                  {category.commands.map((cmd) => (
                    <div
                      key={cmd.cmd}
                      className="group flex items-start gap-2 px-3 py-2 hover:bg-card rounded-lg cursor-pointer"
                      onClick={() => onExecuteCommand?.(cmd.cmd)}
                    >
                      <Terminal className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <code className="text-sm font-mono text-foreground">
                          {cmd.cmd}
                        </code>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cmd.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCommand(cmd.cmd);
                        }}
                      >
                        {copiedCmd === cmd.cmd ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
