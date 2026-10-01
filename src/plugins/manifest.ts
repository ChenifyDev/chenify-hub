import {
    PLUGIN_SLOTS,
    type PluginFile,
    type PluginManifest,
    type PluginSlot,
    isPluginSlot,
    isScriptPath,
    isTextPath,
} from "./types.ts";

export const MANIFEST_NAME = "plugin.json";
export const UI_DIR = "ui";

/** 安装包体积上限，防止 zip 炸弹或超大资源撑爆 IndexedDB。 */
export const MAX_FILES = 200;
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 16 * 1024 * 1024;

const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;

/** 插件包结构或 plugin.json 有问题时抛出，消息直接展示给用户。 */
export class PluginError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PluginError";
    }
}

/**
 * 归一化包内路径：统一正斜杠、去掉前导 "./" 与 "/"。
 * 不解析 ".."，路径逃逸由 safeJoin 负责。
 */
export function normalizePath(input: string): string {
    const unified = input.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
    const parts: string[] = [];
    for (const segment of unified.split("/")) {
        if (!segment || segment === ".") continue;
        parts.push(segment);
    }
    return parts.join("/");
}

/**
 * 拼接包内相对路径。解析 ".." 后若越过包根则抛错（zip-slip / 路径逃逸防护）。
 */
export function safeJoin(base: string, ref: string): string {
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(ref)) {
        throw new PluginError(`路径不能是 URL：${ref}`);
    }
    const parts = base ? base.split("/") : [];
    for (const segment of normalizePath(ref).split("/")) {
        if (segment === "..") {
            if (!parts.length) throw new PluginError(`路径超出了插件包范围：${ref}`);
            parts.pop();
        } else if (segment !== ".") {
            parts.push(segment);
        }
    }
    return parts.join("/");
}

/** 取 ref 相对于 fromPath 所在目录的解析结果；ref 以 "/" 开头则视为包根。 */
export function resolveRef(fromPath: string, ref: string): string {
    if (ref.startsWith("/")) return safeJoin("", ref);
    const slash = fromPath.lastIndexOf("/");
    return safeJoin(slash < 0 ? "" : fromPath.slice(0, slash), ref);
}

export function fileSize(file: PluginFile): number {
    return file.kind === "text" ? new Blob([file.text]).size : file.bytes.byteLength;
}

export function toFileMap(files: readonly PluginFile[]): Map<string, PluginFile> {
    const map = new Map<string, PluginFile>();
    for (const file of files) {
        const path = normalizePath(file.path);
        if (path) map.set(path, { ...file, path });
    }
    return map;
}

function readString(source: Record<string, unknown>, key: string, fallback = ""): string {
    const value = source[key];
    if (value === undefined || value === null) return fallback;
    if (typeof value !== "string") throw new PluginError(`plugin.json 的 "${key}" 必须是字符串`);
    return value;
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new PluginError(`plugin.json 的 "${label}" 必须是一个对象`);
    }
    return value as Record<string, unknown>;
}

/** 统计包体积，超限直接抛错。 */
export function checkPackageLimits(files: readonly PluginFile[]): void {
    if (files.length > MAX_FILES) {
        throw new PluginError(`文件数量超出上限（${files.length} > ${MAX_FILES}）`);
    }
    let total = 0;
    for (const file of files) {
        const size = fileSize(file);
        if (size > MAX_FILE_BYTES) {
            throw new PluginError(`单个文件超过 ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB：${file.path}`);
        }
        total += size;
    }
    if (total > MAX_TOTAL_BYTES) {
        throw new PluginError(`插件包总体积超过 ${Math.round(MAX_TOTAL_BYTES / 1024 / 1024)}MB`);
    }
}

/** 从原始 JSON（可以是对象或字符串）解析并校验 plugin.json。 */
export function parseManifest(raw: unknown, files: Map<string, PluginFile>): PluginManifest {
    let source: Record<string, unknown>;
    try {
        source = asRecord(typeof raw === "string" ? JSON.parse(raw) : raw, "根");
    } catch (err) {
        if (err instanceof PluginError) throw err;
        throw new PluginError(`plugin.json 不是合法的 JSON：${err instanceof Error ? err.message : String(err)}`);
    }

    const id = readString(source, "id").trim();
    if (!ID_PATTERN.test(id)) {
        throw new PluginError('plugin.json 的 "id" 只能包含小写字母、数字、. _ -，且以字母或数字开头（最长 64 位）');
    }
    const name = readString(source, "name").trim();
    if (!name) throw new PluginError('plugin.json 缺少 "name"');

    const hasUiDir = [...files.keys()].some((path) => path === UI_DIR || path.startsWith(`${UI_DIR}/`));
    if (!hasUiDir) {
        throw new PluginError(`插件包必须包含 ${UI_DIR}/ 目录（shadcn/ui + Base UI 格式的 .tsx 源码）`);
    }

    const ui = asRecord(source.ui, "ui");
    const styleField = ui.style ?? [];
    if (!Array.isArray(styleField)) throw new PluginError('plugin.json 的 "ui.style" 必须是数组');
    const style = styleField.map((entry, index) => {
        if (typeof entry !== "string") throw new PluginError(`"ui.style[${index}]" 必须是字符串`);
        return resolveRef(MANIFEST_NAME, entry);
    });
    for (const path of style) {
        const file = files.get(path);
        if (!file) throw new PluginError(`"ui.style" 引用的文件不存在：${path}`);
        if (file.kind !== "text") throw new PluginError(`样式文件必须是文本：${path}`);
    }

    // 键被 isPluginSlot 收窄成 PluginSlot，赋值处因此不会再退回到 string
    const components: Partial<Record<PluginSlot, string>> = {};
    for (const [slot, ref] of Object.entries(asRecord(ui.components ?? {}, "ui.components"))) {
        if (!isPluginSlot(slot)) {
            throw new PluginError(`未知的组件插槽 "${slot}"。可用插槽：${PLUGIN_SLOTS.join(", ")}`);
        }
        if (typeof ref !== "string") throw new PluginError(`"ui.components.${slot}" 必须是字符串`);
        const path = resolveRef(MANIFEST_NAME, ref);
        const file = files.get(path);
        if (!file) throw new PluginError(`插槽 "${slot}" 引用的文件不存在：${path}`);
        if (file.kind !== "text" || !isScriptPath(path)) {
            throw new PluginError(`插槽 "${slot}" 必须指向一个 TSX/TS 源码文件：${path}`);
        }
        components[slot] = path;
    }

    if (!style.length && !Object.keys(components).length) {
        throw new PluginError("插件没有声明任何 ui.style 或 ui.components，安装后不会产生任何效果");
    }

    const manifest: PluginManifest = {
        id,
        name,
        version: readString(source, "version").trim() || "0.0.0",
        author: readString(source, "author").trim(),
        description: readString(source, "description").trim(),
        ui: { style, components },
    };

    // 样式与组件的相对 import 需要能被解析，这里提前把明显不可用的资源挡掉。
    for (const file of files.values()) {
        if (file.kind !== "text" || !isScriptPath(file.path)) continue;
        if (file.text.includes("\0")) throw new PluginError(`文件含有非法字符：${file.path}`);
    }

    return manifest;
}

export { isTextPath };
