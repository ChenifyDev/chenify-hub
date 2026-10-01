import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactJsxRuntime from "react/jsx-runtime";
import * as ReactJsxDevRuntime from "react/jsx-dev-runtime";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

import { cn } from "@/lib/utils";
import { useHostUI, usePluginUI } from "./api.ts";
import { safeJoin } from "./manifest.ts";
import { setPluginStyle } from "./styles.ts";
import {
    PLUGIN_SLOT_MODULES,
    SCRIPT_EXTENSIONS,
    isScriptPath,
    type PluginFile,
    type PluginSdk,
    type PluginSlot,
} from "./types.ts";

export class PluginResolveError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PluginResolveError";
    }
}

type ModuleExports = Record<string, unknown>;

const namespace = (value: object): ModuleExports => value as unknown as ModuleExports;

const HOST_UI_MODULES: Record<string, ModuleExports> = Object.fromEntries(
    Object.entries(import.meta.glob("../components/ui/*.tsx", { eager: true }) as Record<string, ModuleExports>).map(
        ([path, mod]) => [path.slice(path.lastIndexOf("/") + 1, -".tsx".length), mod],
    ),
);

const WRAPPED_COMPONENTS = new Set<unknown>();
for (const [file, exportNames] of Object.entries(PLUGIN_SLOT_MODULES)) {
    const mod = HOST_UI_MODULES[file.slice(0, -".tsx".length)];
    for (const name of exportNames) {
        const value = mod?.[name];
        if (typeof value === "function") WRAPPED_COMPONENTS.add(value);
    }
}

const BARE_MODULES = new Map<string, ModuleExports>([
    ["react", namespace(React)],
    ["react-dom", namespace(ReactDOM)],
    ["react-dom/client", namespace(ReactDOM)],
    ["react/jsx-runtime", namespace(ReactJsxRuntime)],
    ["react/jsx-dev-runtime", namespace(ReactJsxDevRuntime)],
    ["class-variance-authority", { cva }],
    ["clsx", { clsx, default: clsx }],
    ["tailwind-merge", { twMerge, default: twMerge }],
    ["@/lib/utils", { cn, default: cn }],
]);

const UI_PREFIX = "@/components/ui/";

function resolveBare(specifier: string, sdk: PluginSdk): ModuleExports | undefined {
    if (specifier === "@/plugins/api") return { plugin: sdk, useHostUI, usePluginUI };
    if (specifier.startsWith(UI_PREFIX)) {
        const mod = HOST_UI_MODULES[specifier.slice(UI_PREFIX.length).replace(/\.tsx?$/, "")];
        return mod && { ...mod };
    }
    return BARE_MODULES.get(specifier);
}

function resolveRelative(specifier: string, importerPath: string, files: Map<string, PluginFile>): string | null {
    const slash = importerPath.lastIndexOf("/");
    const baseDir = slash < 0 ? "" : importerPath.slice(0, slash);

    const candidates: string[] = [specifier];
    const lastSlash = specifier.lastIndexOf("/");
    const lastDot = specifier.slice(lastSlash + 1).lastIndexOf(".");
    const stem = lastDot < 0 ? specifier : specifier.slice(0, lastSlash + 1 + lastDot);
    if (stem === specifier) {
        for (const ext of [...SCRIPT_EXTENSIONS, ".css"]) candidates.push(`${specifier}${ext}`);
        candidates.push(`${specifier}/index.tsx`, `${specifier}/index.ts`);
    } else if (isScriptPath(specifier)) {
        candidates.push(`${specifier}/index.tsx`, `${specifier}/index.ts`);
    } else {
        for (const ext of SCRIPT_EXTENSIONS) candidates.push(`${stem}${ext}`);
    }

    for (const ref of candidates) {
        try {
            const path = ref.startsWith("/") ? safeJoin("", ref) : safeJoin(baseDir, ref);
            if (files.has(path)) return path;
        } catch {}
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

const mimeOf = (path: string) =>
    MIME_BY_EXT[path.slice(path.lastIndexOf(".")).toLowerCase()] ?? "application/octet-stream";

export type PluginGraph = {
    id: string;
    files: Map<string, PluginFile>;
    modules: Map<string, ModuleExports>;
    urls: Map<string, string>;
};

export function createGraph(id: string, files: readonly PluginFile[]): PluginGraph {
    return {
        id,
        files: new Map(files.map((file) => [file.path, file])),
        modules: new Map(),
        urls: new Map(),
    };
}

export function releaseGraph(graph: PluginGraph): void {
    for (const url of graph.urls.values()) URL.revokeObjectURL(url);
    graph.urls.clear();
    graph.modules.clear();
}

function assetUrl(graph: PluginGraph, path: string): string {
    const cached = graph.urls.get(path);
    if (cached) return cached;
    const file = graph.files.get(path);
    if (!file) throw new PluginResolveError(`找不到资源文件：${path}`);
    const url = URL.createObjectURL(new Blob([file.kind === "text" ? file.text : file.bytes], { type: mimeOf(path) }));
    graph.urls.set(path, url);
    return url;
}

function createRequire(graph: PluginGraph, importerPath: string, sdk: PluginSdk): (specifier: string) => unknown {
    return (specifier) => {
        if (specifier.startsWith(".")) {
            const target = resolveRelative(specifier, importerPath, graph.files);
            if (!target) throw new PluginResolveError(`插件包内找不到 ${specifier}（来自 ${importerPath}）`);
            return loadModule(graph, target, sdk);
        }

        const bare = resolveBare(specifier, sdk);
        if (bare) return bare;

        throw new PluginResolveError(
            `插件不支持导入 "${specifier}"（来自 ${importerPath}）。可用：react、react-dom、react/jsx-runtime、` +
                `class-variance-authority、clsx、tailwind-merge、@/lib/utils、@/components/ui/*、@/plugins/api，以及包内的相对路径。`,
        );
    };
}

let transform: typeof import("sucrase").transform | null = null;
let loadingSucrase: Promise<void> | null = null;

export function initTranspiler(): Promise<void> {
    loadingSucrase ??= import("sucrase").then((mod) => {
        transform = mod.transform;
    });
    return loadingSucrase;
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

function loadModule(graph: PluginGraph, path: string, sdk: PluginSdk): ModuleExports {
    const cached = graph.modules.get(path);
    if (cached) return cached;

    const file = graph.files.get(path);
    if (!file) throw new PluginResolveError(`找不到文件：${path}`);

    if (path.toLowerCase().endsWith(".css")) {
        if (file.kind !== "text") throw new PluginResolveError(`样式文件无法读取：${path}`);
        setPluginStyle(graph.id, path, file.text);
        const empty: ModuleExports = {};
        graph.modules.set(path, empty);
        return empty;
    }

    if (!isScriptPath(path)) {
        const asset: ModuleExports = { default: assetUrl(graph, path) };
        graph.modules.set(path, asset);
        return asset;
    }

    if (file.kind !== "text") throw new PluginResolveError(`源码文件无法读取：${path}`);

    const module: { exports: ModuleExports } = { exports: {} };
    graph.modules.set(path, module.exports);

    try {
        const factory = new Function("require", "module", "exports", "__filename", transpile(file.text, path));
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

export function loadSlotComponent(graph: PluginGraph, slot: PluginSlot, path: string, sdk: PluginSdk): unknown {
    const component = loadModule(graph, path, sdk).default;
    if (typeof component !== "function") {
        throw new PluginResolveError(`${path} 需要 default 导出一个 React 组件（插槽 "${slot}"）`);
    }
    return component;
}

export { WRAPPED_COMPONENTS };
