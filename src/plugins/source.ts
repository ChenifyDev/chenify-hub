import { MAX_FILE_BYTES, MANIFEST_NAME, PluginError, normalizePath } from "./manifest.ts";
import { isTextPath, type PluginFile } from "./types.ts";
import { decodeText, unzipPlugin } from "./archive.ts";

type RawFile = { path: string; bytes: Uint8Array };

function assertWithinLimits(files: readonly RawFile[]): void {
    let total = 0;
    for (const file of files) {
        if (file.bytes.byteLength > MAX_FILE_BYTES) {
            throw new PluginError(`文件过大（${Math.round(file.bytes.byteLength / 1024)}KB）：${file.path}`);
        }
        total += file.bytes.byteLength;
    }
    if (total > 16 * 1024 * 1024) throw new PluginError("插件包总体积超过 16MB");
}

function toPluginFiles(raw: readonly RawFile[]): PluginFile[] {
    const seen = new Set<string>();
    const result: PluginFile[] = [];
    for (const file of raw) {
        const path = normalizePath(file.path);
        if (!path || seen.has(path)) continue;
        seen.add(path);
        result.push(isTextPath(path) ? { path, kind: "text", text: decodeText(file.bytes) } : { path, kind: "binary", bytes: file.bytes.buffer.slice(file.bytes.byteOffset, file.bytes.byteOffset + file.bytes.byteLength) as ArrayBuffer });
    }
    return result.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * 读取 <input webkitdirectory> 选中的目录。
 *
 * 浏览器会把选中目录名作为每个文件相对路径的第一段（my-plugin/ui/button.tsx），
 * 需要先剥掉这层公共前缀，plugin.json 才会落在包根。
 */
export async function readFolderSelection(selection: FileList | File[]): Promise<PluginFile[]> {
    const files = Array.from(selection);
    if (!files.length) throw new PluginError("没有选中任何文件");

    const entries: { path: string; file: File }[] = files.map((file) => ({
        path: normalizePath((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name),
        file,
    }));

    const first = entries[0].path;
    const root = first.includes("/") ? first.slice(0, first.indexOf("/")) : "";
    if (root && !entries.every((entry) => entry.path.startsWith(`${root}/`))) {
        throw new PluginError("一次只能选择一个插件目录（选中的文件不在同一个根目录下）");
    }

    const raw: RawFile[] = [];
    for (const entry of entries) {
        const path = root ? entry.path.slice(root.length + 1) : entry.path;
        if (!path) continue;
        const bytes = new Uint8Array(await entry.file.arrayBuffer());
        raw.push({ path, bytes });
    }
    assertWithinLimits(raw);
    return toPluginFiles(raw);
}

/** 读取用户选择的 .zip。zip 内可以带一层根目录，会自动剥离。 */
export async function readZipFile(file: File): Promise<PluginFile[]> {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const entries = unzipPlugin(bytes);

    const list = [...entries.entries()].map(([path, data]) => ({ path, bytes: data }));
    assertWithinLimits(list);

    // 若所有条目都共享同一根目录且该根目录下有 plugin.json，则剥离这层前缀。
    const paths = list.map((entry) => entry.path);
    const root = paths[0]?.includes("/") ? paths[0].slice(0, paths[0].indexOf("/")) : "";
    if (root && entries.has(`${root}/${MANIFEST_NAME}`) && paths.every((path) => path.startsWith(`${root}/`))) {
        for (const entry of list) entry.path = entry.path.slice(root.length + 1);
    }

    return toPluginFiles(list);
}

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

/**
 * 从远程地址安装：先取 plugin.json，再按其中的 files 列表逐个拉取。
 * files 字段是远程安装唯一的文件清单来源。
 */
export async function readRemotePlugin(manifestUrl: string): Promise<PluginFile[]> {
    const url = manifestUrl.trim();
    if (!isHttpUrl(url)) throw new PluginError("请填写 http(s) 开头的 plugin.json 地址");
    if (!/\.json(\?|#|$)/i.test(new URL(url).pathname) && !url.includes("plugin.json")) {
        throw new PluginError("地址需要指向 plugin.json");
    }

    let raw: unknown;
    try {
        const response = await fetch(url, { credentials: "omit" });
        if (!response.ok) throw new PluginError(`拉取 plugin.json 失败：HTTP ${response.status}`);
        raw = await response.json();
    } catch (err) {
        if (err instanceof PluginError) throw err;
        throw new PluginError(`拉取 plugin.json 失败：${err instanceof Error ? err.message : String(err)}`);
    }

    const files = (raw as { files?: unknown }).files;
    if (!Array.isArray(files) || !files.length) {
        throw new PluginError('远程安装要求 plugin.json 中包含 "files" 数组（列出 ui/ 下所有文件）');
    }

    const base = new URL(url);
    const raw2: RawFile[] = [];
    for (const entry of files) {
        if (typeof entry !== "string") throw new PluginError('"files" 中存在非字符串条目');
        const path = normalizePath(entry);
        if (!path) continue;
        const target = new URL(path, base).href;
        let response: Response;
        try {
            response = await fetch(target, { credentials: "omit" });
        } catch (err) {
            throw new PluginError(`拉取 ${path} 失败：${err instanceof Error ? err.message : String(err)}`);
        }
        if (!response.ok) throw new PluginError(`拉取 ${path} 失败：HTTP ${response.status}`);
        raw2.push({ path, bytes: new Uint8Array(await response.arrayBuffer()) });
    }
    assertWithinLimits(raw2);
    return toPluginFiles(raw2);
}
