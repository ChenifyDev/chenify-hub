/**
 * 插件系统的类型定义。
 *
 * 一个 UI 插件就是一个包含 plugin.json 与 ui/ 目录的包：
 *
 *   cozy-purple/
 *   ├── plugin.json
 *   └── ui/
 *       ├── styles.css
 *       └── button.tsx
 *
 * 运行时完全在浏览器内完成：读取文件 → IndexedDB 持久化 → sucrase 转译 TSX
 * → 以 require 代理注入宿主模块 → 替换 ui/*.tsx 的组件插槽。
 */

/** 插件来源，仅用于在管理页展示。 */
export type PluginInstallSource = "folder" | "zip" | "url";

/** plugin.json 中 ui 字段的结构。 */
export type PluginManifestUi = {
    /** 需要注入到 <head> 的全局样式（通常是 ui/styles.css）。 */
    style: string[];
    /** 插槽名 → 替换宿主组件的模块路径，模块的 default 导出即替换组件。 */
    components: Record<string, string>;
};

/** plugin.json 解析后的规范化结果。 */
export type PluginManifest = {
    id: string;
    name: string;
    version: string;
    author: string;
    description: string;
    ui: PluginManifestUi;
};

/** 包内单个文件。文本存字符串，二进制存 ArrayBuffer（IndexedDB 可直接结构化克隆）。 */
export type PluginFile = { path: string; kind: "text"; text: string } | { path: string; kind: "binary"; bytes: ArrayBuffer };

/** IndexedDB 中持久化的一条插件记录。id 提到顶层以作为 keyPath。 */
export type StoredPlugin = {
    id: string;
    manifest: PluginManifest;
    files: PluginFile[];
    enabled: boolean;
    /** 数字越小越先生效；同槽位后加载的插件覆盖先加载的。 */
    order: number;
    installedAt: number;
    updatedAt: number;
    source: PluginInstallSource;
};

/** 插件运行期错误，插件崩掉时降级回默认组件并在管理页展示。 */
export type PluginError = {
    pluginId: string;
    pluginName: string;
    /** 组件插槽名；纯样式/加载期错误为 undefined。 */
    slot?: string;
    message: string;
    at: number;
};

/**
 * 可被插件替换的宿主组件，按宿主文件分组。
 * 插槽名 = 导出名首字母小写（Button -> button，CardHeader -> cardHeader）。
 */
export const PLUGIN_SLOT_MODULES = {
    "button.tsx": ["Button"],
    "card.tsx": ["Card", "CardHeader", "CardFooter", "CardTitle", "CardAction", "CardDescription", "CardContent"],
    "badge.tsx": ["Badge"],
    "input.tsx": ["Input"],
    "label.tsx": ["Label"],
    "separator.tsx": ["Separator"],
    "skeleton.tsx": ["Skeleton"],
    "checkbox.tsx": ["Checkbox"],
    "tabs.tsx": ["Tabs", "TabsList", "TabsTrigger", "TabsContent"],
    "dialog.tsx": [
        "Dialog",
        "DialogClose",
        "DialogContent",
        "DialogDescription",
        "DialogFooter",
        "DialogHeader",
        "DialogOverlay",
        "DialogPortal",
        "DialogTitle",
        "DialogTrigger",
    ],
    "sheet.tsx": ["Sheet", "SheetTrigger", "SheetClose", "SheetContent", "SheetHeader", "SheetFooter", "SheetTitle", "SheetDescription"],
    "dropdown-menu.tsx": [
        "DropdownMenu",
        "DropdownMenuPortal",
        "DropdownMenuTrigger",
        "DropdownMenuContent",
        "DropdownMenuGroup",
        "DropdownMenuLabel",
        "DropdownMenuItem",
        "DropdownMenuCheckboxItem",
        "DropdownMenuRadioGroup",
        "DropdownMenuRadioItem",
        "DropdownMenuSeparator",
        "DropdownMenuShortcut",
        "DropdownMenuSub",
        "DropdownMenuSubTrigger",
        "DropdownMenuSubContent",
    ],
    "tooltip.tsx": ["Tooltip", "TooltipTrigger", "TooltipContent", "TooltipProvider"],
} as const;

function lowerFirst(value: string): string {
    return value.charAt(0).toLowerCase() + value.slice(1);
}

/** 全部合法插槽名，已排序，用于校验与错误提示。 */
export const PLUGIN_SLOTS: readonly string[] = Object.values(PLUGIN_SLOT_MODULES)
    .flat()
    .map(lowerFirst)
    .sort();

const SLOT_SET = new Set(PLUGIN_SLOTS);

export function isPluginSlot(name: string): boolean {
    return SLOT_SET.has(name);
}

/** 参与 TSX 转译的扩展名。 */
export const SCRIPT_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"] as const;

/** 以文本形式存储的扩展名；其余一律按二进制处理。 */
const TEXT_EXTENSIONS = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".css",
    ".json",
    ".svg",
    ".txt",
    ".md",
    ".html",
    ".htm",
]);

export function isTextPath(path: string): boolean {
    const dot = path.lastIndexOf(".");
    if (dot < 0) return false;
    return TEXT_EXTENSIONS.has(path.slice(dot).toLowerCase());
}

export function isScriptPath(path: string): boolean {
    return SCRIPT_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext));
}
