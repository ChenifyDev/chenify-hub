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
    /**
     * 插槽名 → 替换宿主组件的模块路径，模块的 default 导出即替换组件。
     * 键被约束成 PluginSlot，于是编辑器能补全插槽名、也能标出拼错的。
     */
    components: Partial<Record<PluginSlot, string>>;
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
export type PluginFile = {
    path: string;
    kind: "text";
    text: string;
} | {
    path: string;
    kind: "binary";
    bytes: ArrayBuffer;
};
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
export declare const PLUGIN_SLOT_MODULES: {
    readonly "button.tsx": readonly ["Button"];
    readonly "card.tsx": readonly ["Card", "CardHeader", "CardFooter", "CardTitle", "CardAction", "CardDescription", "CardContent"];
    readonly "badge.tsx": readonly ["Badge"];
    readonly "input.tsx": readonly ["Input"];
    readonly "label.tsx": readonly ["Label"];
    readonly "separator.tsx": readonly ["Separator"];
    readonly "skeleton.tsx": readonly ["Skeleton"];
    readonly "checkbox.tsx": readonly ["Checkbox"];
    readonly "tabs.tsx": readonly ["Tabs", "TabsList", "TabsTrigger", "TabsContent"];
    readonly "dialog.tsx": readonly ["Dialog", "DialogClose", "DialogContent", "DialogDescription", "DialogFooter", "DialogHeader", "DialogOverlay", "DialogPortal", "DialogTitle", "DialogTrigger"];
    readonly "sheet.tsx": readonly ["Sheet", "SheetTrigger", "SheetClose", "SheetContent", "SheetHeader", "SheetFooter", "SheetTitle", "SheetDescription"];
    readonly "dropdown-menu.tsx": readonly ["DropdownMenu", "DropdownMenuPortal", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuGroup", "DropdownMenuLabel", "DropdownMenuItem", "DropdownMenuCheckboxItem", "DropdownMenuRadioGroup", "DropdownMenuRadioItem", "DropdownMenuSeparator", "DropdownMenuShortcut", "DropdownMenuSub", "DropdownMenuSubTrigger", "DropdownMenuSubContent"];
    readonly "tooltip.tsx": readonly ["Tooltip", "TooltipTrigger", "TooltipContent", "TooltipProvider"];
};
/** 首字母小写，与插槽名的推导规则严格对应。 */
type LowerFirst<S extends string> = S extends `${infer Head}${infer Tail}` ? `${Lowercase<Head>}${Tail}` : S;
/**
 * 全部合法插槽名的类型：从上表的导出名推导，不额外维护一份清单。
 * 宿主加一个导出、这里就多一个字面量，改插件组件映射表时会立刻被断言抓住。
 */
export type PluginSlot = LowerFirst<(typeof PLUGIN_SLOT_MODULES)[keyof typeof PLUGIN_SLOT_MODULES][number]>;
/** 全部合法插槽名，已排序，用于校验与错误提示。 */
export declare const PLUGIN_SLOTS: readonly PluginSlot[];
export declare function isPluginSlot(name: string): name is PluginSlot;
/**
 * manifest 里声明的插槽，按声明顺序返回 [插槽名, 模块路径]。
 *
 * Object.keys 只能给出 string[]，调用方又不得不回查一遍 components[slot]（可能是 undefined），
 * 这里一次把类型和存在性都解决掉。
 */
export declare function manifestSlotEntries(manifest: PluginManifest): [PluginSlot, string][];
/** 参与 TSX 转译的扩展名。 */
export declare const SCRIPT_EXTENSIONS: readonly [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
export declare function isTextPath(path: string): boolean;
export declare function isScriptPath(path: string): boolean;
