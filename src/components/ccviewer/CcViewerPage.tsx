import { useState, useEffect, useCallback } from "react";
import {
  FileJson,
  Database,
  Puzzle,
  BookOpen,
  Terminal,
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Loader2,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  X,
  FileText,
  Eye,
  Book,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Keyboard,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getClaudeDir,
  getClaudeDirTree,
  getClaudeVersion,
  getMcpConfig,
  getSettingsConfig,
  getSettingsLocalConfig,
  getClaudeSkills,
  getClaudePlugins,
  executeClaudeCommand,
  readFileContent,
  checkClaudeLatestVersion,
  type FileNode,
  type GitHubRelease,
} from "@/lib/api/ccviewer";
import {
  getHermesDirTree,
  getHermesConfig,
  getHermesMcpConfig,
  getHermesMemory,
  getHermesModelConfig,
  getHermesMemoryLimits,
  readHermesFile,
} from "@/lib/api/viewer/hermes";
import {
  getOpenCodeDirTree,
  getOpenCodeMcpConfig,
  readOpenCodeFile,
} from "@/lib/api/viewer/opencode";
import {
  getCodexDirTree,
  getCodexMcpConfig,
  getCodexSessions,
  readCodexFile,
} from "@/lib/api/viewer/codex";
import { CommandLearning } from "./CommandLearning";

type TabId = "tree" | "settings" | "mcp" | "skills" | "plugins" | "commands" | "commandLearning";
type AppId = "claude" | "hermes" | "opencode" | "codex";

const TAB_KEYS: Record<string, TabId> = {
  "1": "tree",
  "2": "settings",
  "3": "mcp",
  "4": "skills",
  "5": "plugins",
  "6": "commands",
  "7": "commandLearning",
};

const APP_KEYS: Record<string, AppId> = {
  "q": "claude",
  "w": "hermes",
  "e": "opencode",
  "r": "codex",
};

/**
 * ccViewer - Claude Code 配置查看器
 * 专注于 Claude Code 自身配置文件的分析和展示
 */
export function CcViewerPage() {
  const [activeTab, setActiveTab] = useState<TabId>("tree");
  const [activeApp, setActiveApp] = useState<AppId>("claude");
  const [claudeDir, setClaudeDir] = useState<string>("");
  const [version, setVersion] = useState<string>("");
  const [latestVersion, setLatestVersion] = useState<string>("");
  const [latestRelease, setLatestRelease] = useState<GitHubRelease | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showShortcuts, setShowShortcuts] = useState(false);

  // 刷新函数
  const loadBasicInfo = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [dir, ver, latest] = await Promise.all([
        getClaudeDir(),
        getClaudeVersion(),
        checkClaudeLatestVersion().catch(() => null),
      ]);
      setClaudeDir(dir);
      setVersion(ver.trim());
      if (latest) {
        setLatestVersion(latest.tag_name);
        setLatestRelease(latest);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBasicInfo();
  }, [loadBasicInfo]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果在输入框中，不处理快捷键
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      // 数字键 1-7 切换标签页
      if (TAB_KEYS[e.key]) {
        setActiveTab(TAB_KEYS[e.key]);
        return;
      }

      // Q/W/E/R 切换应用
      if (APP_KEYS[e.key.toLowerCase()]) {
        setActiveApp(APP_KEYS[e.key.toLowerCase()]);
        return;
      }

      // R 键刷新
      if (e.key === "r" || e.key === "R") {
        loadBasicInfo();
        return;
      }

      // ? 显示快捷键帮助
      if (e.key === "?") {
        setShowShortcuts((prev) => !prev);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loadBasicInfo]);

  // 比较版本，判断是否有新版本
  const hasNewVersion = latestVersion && version
    ? latestVersion.replace(/^v/, "") !== version.replace(/^v/, "")
    : false;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "tree", label: "目录树", icon: <Folder className="h-4 w-4" /> },
    { id: "settings", label: "Settings", icon: <FileJson className="h-4 w-4" /> },
    { id: "mcp", label: "MCP", icon: <Database className="h-4 w-4" /> },
    { id: "skills", label: "Skills", icon: <BookOpen className="h-4 w-4" /> },
    { id: "plugins", label: "Plugins", icon: <Puzzle className="h-4 w-4" /> },
    { id: "commands", label: "命令执行", icon: <Terminal className="h-4 w-4" /> },
    { id: "commandLearning", label: "命令学习", icon: <Book className="h-4 w-4" /> },
  ];

  const apps: { id: AppId; label: string; icon: React.ReactNode }[] = [
    { id: "claude", label: "Claude Code", icon: <Terminal className="h-4 w-4" /> },
    { id: "hermes", label: "Hermes", icon: <Book className="h-4 w-4" /> },
    { id: "opencode", label: "OpenCode", icon: <Code className="h-4 w-4" /> },
    { id: "codex", label: "Codex", icon: <Database className="h-4 w-4" /> },
  ];

  return (
    <div className="px-6 py-4 flex flex-col flex-1 min-h-0 overflow-hidden bg-background/50">
      {/* 头部信息 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ccViewer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            多应用配置分析器
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {activeApp === "claude" && version && (
            <span className="text-muted-foreground">
              当前版本: <span className="font-mono text-foreground">{version}</span>
            </span>
          )}
          {hasNewVersion && (
            <a
              href={latestRelease?.html_url || "https://github.com/anthropics/claude-code/releases"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
            >
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs font-medium">发现新版本: {latestVersion}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {!hasNewVersion && latestVersion && (
            <span className="flex items-center gap-1 px-2 py-1 text-green-700 dark:text-green-400 text-xs">
              <CheckCircle className="h-3 w-3" />
              已是最新版本
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={loadBasicInfo}>
            <RefreshCw className="h-4 w-4 mr-1" />
            刷新
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowShortcuts(true)} title="快捷键 (?)">
            <Keyboard className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 快捷键帮助弹窗 */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-card border rounded-lg shadow-lg p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">键盘快捷键</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowShortcuts(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">切换应用</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Q</kbd>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">W</kbd>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">E</kbd>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">R</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">切换标签页</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">1-7</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">刷新</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">R</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">显示帮助</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">?</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">关闭弹窗</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 应用选择器 */}
      <div className="flex gap-2 mb-4 p-1 bg-muted/50 rounded-lg w-fit">
        {apps.map((app) => (
          <button
            key={app.id}
            onClick={() => setActiveApp(app.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeApp === app.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {app.icon}
            {app.label}
          </button>
        ))}
      </div>

      {/* 标签页 */}
      <div className="flex gap-1 mb-4 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-medium">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                请确保 Claude Code 已安装并配置正确
              </p>
            </div>
          </div>
        ) : (
          <TabContent
            activeTab={activeTab}
            activeApp={activeApp}
            appDir={claudeDir}
            onSwitchToCommands={() => {
              setActiveTab("commands");
            }}
          />
        )}
      </div>
    </div>
  );
}

interface TabContentProps {
  activeTab: TabId;
  activeApp: AppId;
  appDir: string;
  onSwitchToCommands: (cmd: string) => void;
}

function TabContent({ activeTab, activeApp, appDir, onSwitchToCommands }: TabContentProps) {
  switch (activeTab) {
    case "tree":
      return <DirTreeView appId={activeApp} appDir={appDir} />;
    case "settings":
      return <SettingsView appId={activeApp} />;
    case "mcp":
      return <McpView appId={activeApp} />;
    case "skills":
      return <SkillsView appId={activeApp} />;
    case "plugins":
      return <PluginsView appId={activeApp} />;
    case "commands":
      return <CommandsView appId={activeApp} />;
    case "commandLearning":
      return <CommandLearning onExecuteCommand={onSwitchToCommands} />;
    default:
      return null;
  }
}

/* ==================== 目录树 ==================== */
function DirTreeView({ appId, appDir }: { appId: AppId; appDir: string }) {
  const [tree, setTree] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<{ path: string; name: string } | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loadingFile, setLoadingFile] = useState(false);

  useEffect(() => {
    loadTree();
  }, [appId, appDir]);

  const loadTree = async () => {
    setLoading(true);
    try {
      let data: FileNode;
      switch (appId) {
        case "claude":
          data = await getClaudeDirTree(4);
          break;
        case "hermes":
          data = await getHermesDirTree(4);
          break;
        case "opencode":
          data = await getOpenCodeDirTree(4);
          break;
        case "codex":
          data = await getCodexDirTree(4);
          break;
      }
      setTree(data);
      if (data.path) {
        setExpandedPaths(new Set([data.path]));
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = async (node: FileNode) => {
    if (node.is_dir) return;
    setSelectedFile({ path: node.path, name: node.name });
    setLoadingFile(true);
    setFileContent("");
    try {
      const content = await readFileContent(node.path);
      setFileContent(content);
    } catch (e) {
      setFileContent(`Error loading file: ${e}`);
    } finally {
      setLoadingFile(false);
    }
  };

  const closePreview = () => {
    setSelectedFile(null);
    setFileContent("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4">{error}</div>;
  }

  if (!tree) return null;

  return (
    <div className="h-full flex">
      <div className="flex-1 overflow-auto font-mono text-sm">
        <TreeNode
          node={tree}
          expandedPaths={expandedPaths}
          onToggle={toggleExpand}
          onFileClick={handleFileClick}
          level={0}
        />
      </div>

      {/* 文件预览面板 */}
      {selectedFile && (
        <div className="w-1/2 border-l bg-card flex flex-col">
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="font-medium text-sm truncate">{selectedFile.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={closePreview}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-3">
            {loadingFile ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <pre className="text-sm whitespace-pre-wrap break-all">
                {getPreviewContent(fileContent, selectedFile.name)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TreeNode({
  node,
  expandedPaths,
  onToggle,
  onFileClick,
  level,
}: {
  node: FileNode;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  onFileClick: (node: FileNode) => void;
  level: number;
}) {
  const isExpanded = expandedPaths.has(node.path);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-1 py-1 px-2 hover:bg-muted cursor-pointer group"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => (node.is_dir ? onToggle(node.path) : onFileClick(node))}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )
        ) : (
          <span className="w-3" />
        )}
        {node.is_dir ? (
          <Folder className="h-4 w-4 text-yellow-500" />
        ) : (
          <File className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-foreground">{node.name}</span>
        {!node.is_dir && (
          <span className="text-muted-foreground text-xs ml-2">
            {formatSize(node.size)}
          </span>
        )}
        {!node.is_dir && (
          <Eye className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 ml-auto mr-2" />
        )}
      </div>
      {isExpanded &&
        node.children?.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            expandedPaths={expandedPaths}
            onToggle={onToggle}
            onFileClick={onFileClick}
            level={level + 1}
          />
        ))}
    </div>
  );
}

/* ==================== Settings ==================== */
function SettingsView() {
  const [data, setData] = useState<{ settings: any; localSettings: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [settings, localSettings] = await Promise.all([
        getSettingsConfig().catch(() => null),
        getSettingsLocalConfig().catch(() => null),
      ]);
      setData({ settings, localSettings });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4">{error}</div>;
  }

  return (
    <div className="h-full overflow-auto">
      {data?.settings && (
        <div className="mb-4">
          <h3 className="font-medium mb-2">settings.json</h3>
          <JsonViewer data={data.settings} />
        </div>
      )}
      {data?.localSettings && (
        <div>
          <h3 className="font-medium mb-2">settings.local.json</h3>
          <JsonViewer data={data.localSettings} />
        </div>
      )}
      {!data?.settings && !data?.localSettings && (
        <div className="text-muted-foreground text-center py-8">
          未找到配置文件
        </div>
      )}
    </div>
  );
}

/* ==================== MCP ==================== */
function McpView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMcp();
  }, []);

  const loadMcp = async () => {
    setLoading(true);
    try {
      const config = await getMcpConfig();
      setData(config);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4">{error}</div>;
  }

  return (
    <div className="h-full overflow-auto">
      <h3 className="font-medium mb-2">mcp.json</h3>
      {data ? <JsonViewer data={data} /> : <div className="text-muted-foreground">未找到 MCP 配置</div>}
    </div>
  );
}

/* ==================== Skills ==================== */
function SkillsView() {
  const [data, setData] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<FileNode | null>(null);
  const [skillContent, setSkillContent] = useState<string>("");
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const skills = await getClaudeSkills();
      setData(skills);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const loadSkillDetail = async (skill: FileNode) => {
    setSelectedSkill(skill);
    setLoadingDetail(true);
    setSkillContent("");
    try {
      // 尝试读取 SKILL.md 或 README.md
      const possibleFiles = ["SKILL.md", "README.md", "readme.md", "skill.md"];
      for (const file of possibleFiles) {
        const filePath = skill.path + "/" + file;
        try {
          const content = await readFileContent(filePath);
          setSkillContent(content);
          return;
        } catch {
          continue;
        }
      }
      // 如果都没找到，显示目录内容
      if (skill.children && skill.children.length > 0) {
        setSkillContent("# 目录内容\n\n" +
          skill.children.map(f =>
            `- ${f.name}${f.is_dir ? "/" : ""}`
          ).join("\n")
        );
      } else {
        setSkillContent("未找到 SKILL.md 或 README.md 文件");
      }
    } catch (e) {
      setSkillContent(`Error: ${e}`);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4">{error}</div>;
  }

  return (
    <div className="h-full flex">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto pr-4">
        {data.length === 0 ? (
          <div className="col-span-full text-muted-foreground text-center py-8">
            未找到 Skills
          </div>
        ) : (
          data.map((skill) => (
            <div
              key={skill.path}
              className={`bg-card border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors ${
                selectedSkill?.path === skill.path ? "border-primary" : ""
              }`}
              onClick={() => loadSkillDetail(skill)}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="font-medium">{skill.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 truncate" title={skill.path}>
                {skill.path}
              </p>
            </div>
          ))
        )}
      </div>

      {/* 详情面板 */}
      {selectedSkill && (
        <div className="w-1/2 border-l bg-card flex flex-col">
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="font-medium text-sm">{selectedSkill.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedSkill(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-3">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <pre className="text-sm whitespace-pre-wrap break-all font-mono">
                {skillContent}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== Plugins ==================== */
function PluginsView() {
  const [data, setData] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlugin, setSelectedPlugin] = useState<FileNode | null>(null);
  const [pluginContent, setPluginContent] = useState<string>("");
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    setLoading(true);
    try {
      const plugins = await getClaudePlugins();
      setData(plugins);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const loadPluginDetail = async (plugin: FileNode) => {
    setSelectedPlugin(plugin);
    setLoadingDetail(true);
    setPluginContent("");
    try {
      // 尝试读取 README.md 或 plugin.json
      const possibleFiles = ["README.md", "readme.md", "plugin.json", "manifest.json"];
      for (const file of possibleFiles) {
        const filePath = plugin.path + "/" + file;
        try {
          const content = await readFileContent(filePath);
          setPluginContent(content);
          return;
        } catch {
          continue;
        }
      }
      // 如果都没找到，显示目录内容
      if (plugin.children && plugin.children.length > 0) {
        setPluginContent("# 目录内容\n\n" +
          plugin.children.map(f =>
            `- ${f.name}${f.is_dir ? "/" : ""}`
          ).join("\n")
        );
      } else {
        setPluginContent("未找到 README.md 或配置文件");
      }
    } catch (e) {
      setPluginContent(`Error: ${e}`);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4">{error}</div>;
  }

  return (
    <div className="h-full flex">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto pr-4">
        {data.length === 0 ? (
          <div className="col-span-full text-muted-foreground text-center py-8">
            未找到 Plugins
          </div>
        ) : (
          data.map((plugin) => (
            <div
              key={plugin.path}
              className={`bg-card border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors ${
                selectedPlugin?.path === plugin.path ? "border-primary" : ""
              }`}
              onClick={() => loadPluginDetail(plugin)}
            >
              <div className="flex items-center gap-2">
                <Puzzle className="h-5 w-5 text-primary" />
                <span className="font-medium">{plugin.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 truncate" title={plugin.path}>
                {plugin.path}
              </p>
            </div>
          ))
        )}
      </div>

      {/* 详情面板 */}
      {selectedPlugin && (
        <div className="w-1/2 border-l bg-card flex flex-col">
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <Puzzle className="h-4 w-4" />
              <span className="font-medium text-sm">{selectedPlugin.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedPlugin(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-3">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <pre className="text-sm whitespace-pre-wrap break-all font-mono">
                {pluginContent}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== 命令面板 ==================== */
function CommandsView() {
  const [command, setCommand] = useState("--version");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const presetCommands = [
    { label: "版本", cmd: "--version" },
    { label: "帮助", cmd: "--help" },
    { label: "状态", cmd: "status" },
    { label: "模型列表", cmd: "models list" },
  ];

  const executeCommand = async () => {
    if (!command.trim()) return;
    setLoading(true);
    setError("");
    setOutput("");
    try {
      const args = command.trim().split(/\s+/);
      const result = await executeClaudeCommand(args);
      setOutput(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(error || output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 命令输入 */}
      <div className="flex gap-2 mb-4">
        <Input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && executeCommand()}
          placeholder="输入命令，如 --version"
          className="font-mono"
        />
        <Button onClick={executeCommand} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Terminal className="h-4 w-4" />}
        </Button>
      </div>

      {/* 预设命令 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {presetCommands.map((preset) => (
          <Button
            key={preset.cmd}
            variant="outline"
            size="sm"
            onClick={() => {
              setCommand(preset.cmd);
              setOutput("");
              setError("");
            }}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* 输出 */}
      <div className="flex-1 min-h-0">
        <div className="bg-card border rounded-lg h-full overflow-auto">
          <div className="flex items-center justify-between p-2 border-b">
            <span className="text-sm font-medium">输出</span>
            {(output || error) && (
              <Button variant="ghost" size="sm" onClick={copyOutput}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            )}
          </div>
          <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
            {loading ? (
              <span className="text-muted-foreground">执行中...</span>
            ) : error ? (
              <span className="text-destructive">{error}</span>
            ) : (
              output || <span className="text-muted-foreground">命令输出将显示在这里</span>
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}

/* ==================== 工具函数 ==================== */
function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function JsonViewer({ data }: { data: any }) {
  return (
    <pre className="bg-card border rounded-lg p-4 text-sm font-mono overflow-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function getPreviewContent(content: string, filename: string): React.ReactNode {
  // 对于 JSON 文件，尝试格式化
  if (filename.endsWith(".json")) {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  }
  return content;
}
