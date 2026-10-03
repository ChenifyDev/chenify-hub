import { unzipSync } from "fflate";

import { putPlugin } from "./db.ts";
import {
    MANIFEST_NAME,
    MAX_FILE_BYTES,
    MAX_FILES,
    MAX_TOTAL_BYTES,
    PluginValidationError,
    checkPackageLimits,
    normalizePath,
    parseManifest,
    toFileMap,
} from "./manifest.ts";
import { usePluginStore } from "./store.ts";
import {
    isTextPath,
    type PluginFile,
    type PluginInstallSource,
    type PluginManifest,
    type StoredPlugin,
} from "./types.ts";

type RawFile = { path: string; bytes: Uint8Array };

const decoder = new TextDecoder();

function isUnsafeEntryName(name: string): boolean {
    if (!name || name.startsWith("/") || name.includes("\\") || name.includes("\0")) return true;
    return /^[a-zA-Z]:/.test(name) || normalizePath(name).split("/").includes("..");
}

function unzipPlugin(data: Uint8Array): RawFile[] {
    const rejected: string[] = [];
    let entryCount = 0;

    let entries: Record<string, Uint8Array>;
    try {
        entries = unzipSync(data, {
            filter: (file) => {
                if (file.name.endsWith("/")) return false;
                if (isUnsafeEntryName(file.name) || ++entryCount > MAX_FILES) {
                    rejected.push(file.name);
                    return false;
                }
                if (file.originalSize > MAX_FILE_BYTES) {
                    rejected.push(`${file.name}（${Math.round(file.originalSize / 1024)}KB 超过单文件上限）`);
                    return false;
                }
                return true;
            },
        });
    } catch (err) {
        throw new PluginValidationError(`zip 解压失败：${err instanceof Error ? err.message : String(err)}`);
    }

    if (rejected.length) {
        throw new PluginValidationError(
            `zip 中存在被拒绝的条目：${rejected.slice(0, 3).join("、")}${rejected.length > 3 ? " 等" : ""}`,
        );
    }
    return Object.entries(entries).map(([path, bytes]) => ({ path, bytes }));
}

function toPluginFiles(raw: readonly RawFile[]): PluginFile[] {
    const total = raw.reduce((sum, file) => sum + file.bytes.byteLength, 0);
    if (total > MAX_TOTAL_BYTES) {
        throw new PluginValidationError(`插件包总体积超过 ${Math.round(MAX_TOTAL_BYTES / 1024 / 1024)}MB`);
    }

    const paths = raw.map((file) => normalizePath(file.path));
    const root = `${paths[0]?.split("/")[0] ?? ""}/`;
    const stripped =
        paths.every((path) => path.startsWith(root)) && paths.includes(`${root}${MANIFEST_NAME}`)
            ? paths.map((path) => path.slice(root.length))
            : paths;

    const files = new Map<string, PluginFile>();
    stripped.forEach((path, index) => {
        if (!path || files.has(path)) return;
        const bytes = raw[index].bytes;
        files.set(
            path,
            isTextPath(path)
                ? { path, kind: "text", text: decoder.decode(bytes) }
                : { path, kind: "binary", bytes: bytes.slice().buffer as ArrayBuffer },
        );
    });
    return [...files.values()].sort((a, b) => a.path.localeCompare(b.path));
}

const grab = async (url: string, label: string): Promise<Response> => {
    try {
        const response = await fetch(url, { credentials: "omit" });
        if (!response.ok) throw new PluginValidationError(`拉取 ${label} 失败：HTTP ${response.status}`);
        return response;
    } catch (err) {
        throw err instanceof PluginValidationError
            ? err
            : new PluginValidationError(`拉取 ${label} 失败：${err instanceof Error ? err.message : String(err)}`);
    }
};

export async function installFiles(files: PluginFile[], source: PluginInstallSource): Promise<PluginManifest> {
    checkPackageLimits(files);
    const map = toFileMap(files);
    const raw = map.get(MANIFEST_NAME);
    if (raw?.kind !== "text") throw new PluginValidationError(`插件包根目录缺少 ${MANIFEST_NAME}`);
    const manifest = parseManifest(raw.text, map);

    const plugins = usePluginStore.getState().plugins;
    const previous = plugins.find((plugin) => plugin.id === manifest.id);
    const now = Date.now();
    const record: StoredPlugin = {
        id: manifest.id,
        manifest,
        files: [...map.values()],
        enabled: previous?.enabled ?? true,
        order: previous?.order ?? Math.max(-1, ...plugins.map((plugin) => plugin.order)) + 1,
        installedAt: previous?.installedAt ?? now,
        updatedAt: now,
        source,
    };

    await putPlugin(record);
    usePluginStore
        .getState()
        .setPlugins(
            previous ? plugins.map((plugin) => (plugin.id === manifest.id ? record : plugin)) : [...plugins, record],
        );
    return manifest;
}

export async function installFromFolder(selection: FileList | File[]): Promise<PluginManifest> {
    const raw: RawFile[] = [];
    for (const file of Array.from(selection)) {
        raw.push({ path: file.webkitRelativePath || file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
    }
    return installFiles(toPluginFiles(raw), "folder");
}

export async function installFromZip(file: File): Promise<PluginManifest> {
    return installFiles(toPluginFiles(unzipPlugin(new Uint8Array(await file.arrayBuffer()))), "zip");
}

export async function installFromUrl(manifestUrl: string): Promise<PluginManifest> {
    const url = manifestUrl.trim();
    if (!/^https?:\/\/.+/i.test(url)) throw new PluginValidationError("请填写 http(s) 开头的 plugin.json 地址");
    const base = new URL(url);
    if (!base.pathname.endsWith("/plugin.json")) throw new PluginValidationError("地址需要指向 plugin.json");

    const listing = (await (await grab(url, "plugin.json")).json()) as { files?: unknown };

    const listed = listing.files;
    if (!Array.isArray(listed) || !listed.length) {
        throw new PluginValidationError('远程安装要求 plugin.json 中包含 "files" 数组（列出 ui/ 下所有文件）');
    }

    const paths = listed.map((entry) => {
        if (typeof entry !== "string") throw new PluginValidationError('"files" 中存在非字符串条目');
        return normalizePath(entry);
    });
    const raw = await Promise.all(
        paths.map(async (path) => {
            const response = await grab(new URL(path, base).href, path);
            return { path, bytes: new Uint8Array(await response.arrayBuffer()) };
        }),
    );
    return installFiles(toPluginFiles(raw), "url");
}
