import {
    PLUGIN_SLOTS,
    type PluginFile,
    type PluginManifest,
    type PluginSlot,
    isPluginSlot,
    isScriptPath,
} from "./types.ts";

export const MANIFEST_NAME = "plugin.json";
export const UI_DIR = "ui";
export const MAX_FILES = 200;
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 16 * 1024 * 1024;

const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;

export class PluginValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PluginValidationError";
    }
}

export const normalizePath = (input: string) =>
    input
        .replace(/\\/g, "/")
        .split("/")
        .filter((segment) => segment && segment !== ".")
        .join("/");

export function safeJoin(base: string, ref: string): string {
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(ref)) throw new PluginValidationError(`路径不能是 URL：${ref}`);
    const parts = base ? base.split("/") : [];
    for (const segment of normalizePath(ref).split("/")) {
        if (segment === "..") {
            if (!parts.length) throw new PluginValidationError(`路径超出了插件包范围：${ref}`);
            parts.pop();
        } else {
            parts.push(segment);
        }
    }
    return parts.join("/");
}

function resolveRef(fromPath: string, ref: string): string {
    if (ref.startsWith("/")) return safeJoin("", ref);
    return safeJoin(fromPath.slice(0, fromPath.lastIndexOf("/") + 1), ref);
}

export const fileSize = (file: PluginFile) =>
    file.kind === "text" ? new Blob([file.text]).size : file.bytes.byteLength;

export function toFileMap(files: readonly PluginFile[]): Map<string, PluginFile> {
    const map = new Map<string, PluginFile>();
    for (const file of files) {
        const path = normalizePath(file.path);
        if (path) map.set(path, { ...file, path });
    }
    return map;
}

function readString(source: Record<string, unknown>, key: string): string {
    const value = source[key];
    if (value === undefined || value === null) return "";
    if (typeof value !== "string") throw new PluginValidationError(`plugin.json 的 "${key}" 必须是字符串`);
    return value;
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new PluginValidationError(`plugin.json 的 "${label}" 必须是一个对象`);
    }
    return value as Record<string, unknown>;
}

export function checkPackageLimits(files: readonly PluginFile[]): void {
    if (files.length > MAX_FILES) {
        throw new PluginValidationError(`文件数量超出上限（${files.length} > ${MAX_FILES}）`);
    }
    const mb = Math.round(MAX_FILE_BYTES / 1024 / 1024);
    const total = files.reduce((sum, file) => {
        const size = fileSize(file);
        if (size > MAX_FILE_BYTES) throw new PluginValidationError(`单个文件超过 ${mb}MB：${file.path}`);
        return sum + size;
    }, 0);
    if (total > MAX_TOTAL_BYTES)
        throw new PluginValidationError(`插件包总体积超过 ${Math.round(MAX_TOTAL_BYTES / 1024 / 1024)}MB`);
}

export function parseManifest(raw: unknown, files: Map<string, PluginFile>): PluginManifest {
    let source: Record<string, unknown>;
    try {
        source = asRecord(typeof raw === "string" ? JSON.parse(raw) : raw, "根");
    } catch (err) {
        if (err instanceof PluginValidationError) throw err;
        throw new PluginValidationError(
            `plugin.json 不是合法的 JSON：${err instanceof Error ? err.message : String(err)}`,
        );
    }

    const id = readString(source, "id").trim();
    if (!ID_PATTERN.test(id)) {
        throw new PluginValidationError(
            'plugin.json 的 "id" 只能包含小写字母、数字、. _ -，且以字母或数字开头（最长 64 位）',
        );
    }
    const name = readString(source, "name").trim();
    if (!name) throw new PluginValidationError('plugin.json 缺少 "name"');
    if (![...files.keys()].some((path) => path === UI_DIR || path.startsWith(`${UI_DIR}/`))) {
        throw new PluginValidationError(`插件包必须包含 ${UI_DIR}/ 目录（shadcn/ui + Base UI 格式的 .tsx 源码）`);
    }

    const ui = asRecord(source.ui, "ui");
    if (!Array.isArray(ui.style ?? [])) throw new PluginValidationError('plugin.json 的 "ui.style" 必须是数组');
    const style = ((ui.style ?? []) as unknown[]).map((entry, index) => {
        if (typeof entry !== "string") throw new PluginValidationError(`"ui.style[${index}]" 必须是字符串`);
        const path = resolveRef(MANIFEST_NAME, entry);
        const file = files.get(path);
        if (!file) throw new PluginValidationError(`"ui.style" 引用的文件不存在：${path}`);
        if (file.kind !== "text") throw new PluginValidationError(`样式文件必须是文本：${path}`);
        return path;
    });

    const components: Partial<Record<PluginSlot, string>> = {};
    for (const [slot, ref] of Object.entries(asRecord(ui.components ?? {}, "ui.components"))) {
        if (!isPluginSlot(slot)) {
            throw new PluginValidationError(`未知的组件插槽 "${slot}"。可用插槽：${PLUGIN_SLOTS.join(", ")}`);
        }
        if (typeof ref !== "string") throw new PluginValidationError(`"ui.components.${slot}" 必须是字符串`);
        const path = resolveRef(MANIFEST_NAME, ref);
        const file = files.get(path);
        if (!file) throw new PluginValidationError(`插槽 "${slot}" 引用的文件不存在：${path}`);
        if (file.kind !== "text" || !isScriptPath(path)) {
            throw new PluginValidationError(`插槽 "${slot}" 必须指向一个 TSX/TS 源码文件：${path}`);
        }
        components[slot] = path;
    }

    if (!style.length && !Object.keys(components).length) {
        throw new PluginValidationError("插件没有声明任何 ui.style 或 ui.components，安装后不会产生任何效果");
    }

    for (const file of files.values()) {
        if (file.kind === "text" && isScriptPath(file.path) && file.text.includes("\0")) {
            throw new PluginValidationError(`文件含有非法字符：${file.path}`);
        }
    }

    return {
        id,
        name,
        version: readString(source, "version").trim() || "0.0.0",
        author: readString(source, "author").trim(),
        description: readString(source, "description").trim(),
        ui: { style, components },
    };
}
