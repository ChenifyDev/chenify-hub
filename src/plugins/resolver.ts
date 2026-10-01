/**
 * 插件模块解析：把插件源码里的 import 指向宿主。
 *
 * 插件源码经 sucrase 转成 CJS 后，`require(specifier)` 由这里接管：
 * 裸标识符走宿主的同步模块表，@base-ui/react/* 走预热过的动态 import，
 * 相对路径在插件包内递归解析，样式与图片资源转成 <style> 与 blob URL。
 *
 * 关键约束：react / react-js-runtime 必须解析到宿主实例。插件若拿到另一份 React，
 * hooks 会直接失效，所以这里不做任何 React 的二次拷贝。
 *
 * @base-ui/react/* 与 lucide 图标都不在这里静态 import：静态引入包根 / 命名空间会把 base-ui 的
 * 50 个子路径与 lucide 的两千多个图标全部标记为已使用，从而留在主包里。它们由
 * prewarmModules 从 virtual:chenify-plugin-host 按需动态加载，插件没用到就不下载。
 */
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactJsxRuntime from "react/jsx-runtime";
import * as ReactJsxDevRuntime from "react/jsx-dev-runtime";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

import { cn } from "@/lib/utils";
import { useHostUI, usePluginUI } from "./api.tsx";
import { createPluginSdk, type PluginSdk } from "./sdk.ts";
import { safeJoin } from "./manifest.ts";
import { setPluginStyle } from "./styles.ts";
import { PLUGIN_SLOT_MODULES, SCRIPT_EXTENSIONS, type PluginFile, type PluginSlot } from "./types.ts";
import { isScriptPath } from "./types.ts";
import { baseUiModules, loadLucideIcons, lucideStaticModules } from "virtual:chenify-plugin-host";

import * as AvatarModule from "@/components/ui/avatar.tsx";
import * as BadgeModule from "@/components/ui/badge.tsx";
import * as ButtonGroupModule from "@/components/ui/button-group.tsx";
import * as ButtonModule from "@/components/ui/button.tsx";
import * as CardModule from "@/components/ui/card.tsx";
import * as CheckboxModule from "@/components/ui/checkbox.tsx";
import * as DialogModule from "@/components/ui/dialog.tsx";
import * as DropdownMenuModule from "@/components/ui/dropdown-menu.tsx";
import * as InputModule from "@/components/ui/input.tsx";
import * as LabelModule from "@/components/ui/label.tsx";
import * as SeparatorModule from "@/components/ui/separator.tsx";
import * as SheetModule from "@/components/ui/sheet.tsx";
import * as SidebarModule from "@/components/ui/sidebar.tsx";
import * as SkeletonModule from "@/components/ui/skeleton.tsx";
import * as SonnerModule from "@/components/ui/sonner.tsx";
import * as TabsModule from "@/components/ui/tabs.tsx";
import * as TooltipModule from "@/components/ui/tooltip.tsx";

/** 解析或执行失败时抛给用户的消息。 */
export class PluginResolveError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PluginResolveError";
    }
}

const HOST_UI_MODULES: Record<string, Record<string, unknown>> = {
    avatar: AvatarModule as unknown as Record<string, unknown>,
    badge: BadgeModule as unknown as Record<string, unknown>,
    "button-group": ButtonGroupModule as unknown as Record<string, unknown>,
    button: ButtonModule as unknown as Record<string, unknown>,
    card: CardModule as unknown as Record<string, unknown>,
    checkbox: CheckboxModule as unknown as Record<string, unknown>,
    dialog: DialogModule as unknown as Record<string, unknown>,
    "dropdown-menu": DropdownMenuModule as unknown as Record<string, unknown>,
    input: InputModule as unknown as Record<string, unknown>,
    label: LabelModule as unknown as Record<string, unknown>,
    separator: SeparatorModule as unknown as Record<string, unknown>,
    sheet: SheetModule as unknown as Record<string, unknown>,
    sidebar: SidebarModule as unknown as Record<string, unknown>,
    skeleton: SkeletonModule as unknown as Record<string, unknown>,
    sonner: SonnerModule as unknown as Record<string, unknown>,
    tabs: TabsModule as unknown as Record<string, unknown>,
    tooltip: TooltipModule as unknown as Record<string, unknown>,
};

/**
 * 已被 withPluginUI 包装过的宿主组件。
 *
 * 插件若把宿主的包装组件原样再赋回同一插槽，会形成无限递归，
 * 因此构建覆盖表时用引用相等把这种无效覆盖剔掉。
 */
const WRAPPED_COMPONENTS = new Set<unknown>();
for (const [file, exportNames] of Object.entries(PLUGIN_SLOT_MODULES)) {
    const mod = HOST_UI_MODULES[file.replace(/\.tsx$/, "")];
    if (!mod) continue;
    for (const name of exportNames) {
        const value = mod[name];
        if (typeof value === "function") WRAPPED_COMPONENTS.add(value);
    }
}

/** 裸标识符的同步模块表。 */
function resolveBare(specifier: string, graph: PluginGraph, sdk: PluginSdk): Record<string, unknown> | undefined {
    switch (specifier) {
        case "react":
            return React as unknown as Record<string, unknown>;
        case "react-dom":
        case "react-dom/client":
            return ReactDOM as unknown as Record<string, unknown>;
        case "react/jsx-runtime":
            return ReactJsxRuntime as unknown as Record<string, unknown>;
        case "react/jsx-dev-runtime":
            return ReactJsxDevRuntime as unknown as Record<string, unknown>;
        case "lucide-react":
            return graph.lucide;
        case "class-variance-authority":
            return { cva } as unknown as Record<string, unknown>;
        case "clsx":
            return { clsx, default: clsx } as unknown as Record<string, unknown>;
        case "tailwind-merge":
            return { twMerge, default: twMerge } as unknown as Record<string, unknown>;
        case "@/lib/utils":
            return { cn, default: cn } as unknown as Record<string, unknown>;
        case "@/plugins/api":
            return { plugin: sdk, useHostUI, usePluginUI } as unknown as Record<string, unknown>;
        default:
            break;
    }

    const prefix = "@/components/ui/";
    if (specifier.startsWith(prefix)) {
        const mod = HOST_UI_MODULES[specifier.slice(prefix.length).replace(/\.tsx?$/, "")];
        return mod ? { ...mod } : undefined;
    }
    return undefined;
}

/** 相对路径候选：先按原样，再按"换扩展名 / 补 index"的方式兜底。 */
function resolveRelative(specifier: string, importerPath: string, files: Map<string, PluginFile>): string | null {
    const slash = importerPath.lastIndexOf("/");
    const baseDir = slash < 0 ? "" : importerPath.slice(0, slash);

    const refs: string[] = [specifier];
    const lastSlash = specifier.lastIndexOf("/");
    const lastSegment = lastSlash < 0 ? specifier : specifier.slice(lastSlash + 1);
    const lastDot = lastSegment.lastIndexOf(".");
    const dot = lastDot < 0 ? -1 : lastSlash + 1 + lastDot;
    if (dot < 0) {
        for (const ext of [...SCRIPT_EXTENSIONS, ".css"]) refs.push(`${specifier}${ext}`);
        refs.push(`${specifier}/index.tsx`, `${specifier}/index.ts`);
    } else if (isScriptPath(specifier)) {
        refs.push(`${specifier}/index.tsx`, `${specifier}/index.ts`);
    } else {
        const stem = specifier.slice(0, dot);
        for (const ext of SCRIPT_EXTENSIONS) refs.push(`${stem}${ext}`);
    }

    const tried = new Set<string>();
    for (const ref of refs) {
        if (tried.has(ref)) continue;
        tried.add(ref);
        let path: string;
        try {
            path = ref.startsWith("/") ? safeJoin("", ref) : safeJoin(baseDir, ref);
        } catch {
            continue;
        }
        if (files.has(path)) return path;
    }
    return null;
}

const MIME_BY_EXT: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
};

function mimeOf(path: string): string {
    const dot = path.lastIndexOf(".");
    return dot < 0
        ? "application/octet-stream"
        : (MIME_BY_EXT[path.slice(dot).toLowerCase()] ?? "application/octet-stream");
}

/** 单个插件的求值上下文。 */
export type PluginGraph = {
    id: string;
    files: Map<string, PluginFile>;
    modules: Map<string, Record<string, unknown>>;
    /** @base-ui/react/* 的预热结果，让 require 可以保持同步。 */
    baseUi: Map<string, unknown>;
    /** lucide 图标命名空间：应用已用的图标直接可用，其余在预热时补齐。 */
    lucide: Record<string, unknown>;
    /** 完整图标集是否已加载，避免重复下载。 */
    lucideFull: boolean;
    /** 资源文件的 blob URL，插件停用时统一 revoke。 */
    urls: Map<string, string>;
};

export function createGraph(id: string, files: readonly PluginFile[]): PluginGraph {
    const map = new Map<string, PluginFile>();
    for (const file of files) map.set(file.path, file);
    return {
        id,
        files: map,
        modules: new Map(),
        baseUi: new Map(),
        lucide: { ...lucideStaticModules },
        lucideFull: false,
        urls: new Map(),
    };
}

export function releaseGraph(graph: PluginGraph): void {
    for (const url of graph.urls.values()) URL.revokeObjectURL(url);
    graph.urls.clear();
    graph.baseUi.clear();
    graph.modules.clear();
}

function assetUrl(graph: PluginGraph, path: string): string {
    const cached = graph.urls.get(path);
    if (cached) return cached;
    const file = graph.files.get(path);
    if (!file) throw new PluginResolveError(`找不到资源文件：${path}`);
    const source = file.kind === "text" ? file.text : file.bytes;
    const url = URL.createObjectURL(new Blob([source], { type: mimeOf(path) }));
    graph.urls.set(path, url);
    return url;
}

/** 扫描插件源码里的裸导入语句。 */
const BARE_IMPORT_RE = /(?:\bfrom\s*|\bimport\s*|\brequire\s*\(\s*|\bimport\s*\(\s*)["']([^"']+)["']/g;

function isBaseUiSpecifier(specifier: string): boolean {
    return specifier === "@base-ui/react" || specifier.startsWith("@base-ui/react/");
}

/**
 * 提前加载插件用到的外部模块。
 *
 * require 是同步的，而这些模块走的是动态 import，所以必须在求值任何插件模块之前
 * 把它们 await 完。绝大多数插件只用得到应用本身已经加载的那几个 base-ui 子路径和
 * 已经在主包里的 lucide 图标，这时这里不会产生任何网络请求。
 */
export async function prewarmModules(graph: PluginGraph): Promise<void> {
    const specifiers = new Set<string>();
    for (const file of graph.files.values()) {
        if (file.kind !== "text" || !isScriptPath(file.path)) continue;
        for (const match of file.text.matchAll(BARE_IMPORT_RE)) {
            const specifier = match[1];
            if (isBaseUiSpecifier(specifier) || specifier === "lucide-react") specifiers.add(specifier);
        }
    }
    if (!specifiers.size) return;

    const tasks: Promise<void>[] = [];
    for (const specifier of specifiers) {
        if (isBaseUiSpecifier(specifier)) {
            if (graph.baseUi.has(specifier)) continue;
            const loader = baseUiModules[specifier];
            if (!loader) throw new PluginResolveError(`未知的 Base UI 模块：${specifier}`);
            tasks.push(loader().then((mod) => void graph.baseUi.set(specifier, mod)));
        } else if (graph.lucideFull) {
        } else {
            tasks.push(
                loadLucideIcons().then((mod) => {
                    graph.lucideFull = true;
                    graph.lucide = { ...graph.lucide, ...(mod as Record<string, unknown>) };
                }),
            );
        }
    }
    await Promise.all(tasks);
}

/** 为某个模块构造绑定到它自身路径的 require，这样相对路径才知道以谁为基准。 */
function createRequire(graph: PluginGraph, importerPath: string, sdk: PluginSdk): (specifier: string) => unknown {
    return (specifier) => {
        if (specifier.startsWith(".")) {
            const target = resolveRelative(specifier, importerPath, graph.files);
            if (!target) throw new PluginResolveError(`插件包内找不到 ${specifier}（来自 ${importerPath}）`);
            return loadModule(graph, target, sdk);
        }

        const bare = resolveBare(specifier, graph, sdk);
        if (bare) return bare;

        const baseUi = graph.baseUi.get(specifier);
        if (baseUi) return baseUi;

        throw new PluginResolveError(
            `插件不支持导入 "${specifier}"（来自 ${importerPath}）。可用：react、react-dom、react/jsx-runtime、` +
                `lucide-react、class-variance-authority、clsx、tailwind-merge、@base-ui/react/*、` +
                `@/lib/utils、@/components/ui/*、@/plugins/api，以及包内的相对路径。`,
        );
    };
}

let transform: typeof import("sucrase").transform | null = null;
let sucraseModule: Promise<void> | null = null;

/** 动态加载转译器：纯样式插件不会走到这里，不为它们付出这部分体积。 */
export function initTranspiler(): Promise<void> {
    sucraseModule ??= import("sucrase").then((mod) => {
        transform = mod.transform;
    });
    return sucraseModule;
}

function transpile(code: string, path: string): string {
    if (!transform) throw new PluginResolveError("转译器尚未加载完成");
    try {
        return transform(code, {
            transforms: ["typescript", "jsx", "imports"],
            jsxRuntime: "automatic",
            filePath: path,
            production: true,
        }).code;
    } catch (err) {
        throw new PluginResolveError(`${path} 转译失败：${err instanceof Error ? err.message : String(err)}`);
    }
}

/** 同步求值一个插件模块，带模块缓存与循环依赖处理。 */
function loadModule(graph: PluginGraph, path: string, sdk: PluginSdk): Record<string, unknown> {
    const cached = graph.modules.get(path);
    if (cached) return cached;

    const file = graph.files.get(path);
    if (!file) throw new PluginResolveError(`找不到文件：${path}`);

    if (path.toLowerCase().endsWith(".css")) {
        if (file.kind !== "text") throw new PluginResolveError(`样式文件无法读取：${path}`);
        setPluginStyle(graph.id, path, file.text);
        const empty: Record<string, unknown> = {};
        graph.modules.set(path, empty);
        return empty;
    }

    if (!isScriptPath(path)) {
        const asset: Record<string, unknown> = { default: assetUrl(graph, path) };
        graph.modules.set(path, asset);
        return asset;
    }

    if (file.kind !== "text") throw new PluginResolveError(`源码文件无法读取：${path}`);

    const code = transpile(file.text, path);
    const module: { exports: Record<string, unknown> } = { exports: {} };
    // 先登记空 exports，循环依赖时拿到的会是同一个（尚未填满的）对象。
    graph.modules.set(path, module.exports);

    try {
        const factory = new Function("require", "module", "exports", "__filename", code);
        factory(createRequire(graph, path, sdk), module, module.exports, path);
    } catch (err) {
        graph.modules.delete(path);
        throw err instanceof PluginResolveError
            ? err
            : new PluginResolveError(`${path} 执行失败：${err instanceof Error ? err.message : String(err)}`);
    }

    graph.modules.set(path, module.exports);
    return module.exports;
}

/** 取出插件为某个插槽提供的组件（模块的 default 导出）。 */
export function loadSlotComponent(graph: PluginGraph, slot: PluginSlot, path: string, sdk: PluginSdk): unknown {
    const component = loadModule(graph, path, sdk).default;
    if (typeof component !== "function") {
        throw new PluginResolveError(`${path} 需要 default 导出一个 React 组件（插槽 "${slot}"）`);
    }
    return component;
}

export function createSdk(id: string, name: string, version: string): PluginSdk {
    return createPluginSdk({ id, name, version });
}

export { WRAPPED_COMPONENTS };
export type { PluginSdk };
