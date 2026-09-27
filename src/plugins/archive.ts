import { strToU8, unzipSync, zipSync } from "fflate";

import { MAX_FILE_BYTES, MAX_FILES, PluginError, normalizePath } from "./manifest.ts";
import type { PluginFile } from "./types.ts";

const decoder = new TextDecoder();

function isUnsafeEntryName(name: string): boolean {
    if (!name || name.startsWith("/") || name.includes("\\") || name.includes("\0")) return true;
    if (/^[a-zA-Z]:/.test(name)) return true;
    return normalizePath(name).split("/").some((segment) => segment === "..");
}

/**
 * 解压插件 zip。
 *
 * fflate 的 filter 在解压前回调，可以据此挡住目录条目、超大条目与路径逃逸（zip-slip），
 * 避免把整包展开后再校验。
 */
export function unzipPlugin(data: Uint8Array): Map<string, Uint8Array> {
    const rejected: string[] = [];
    let entryCount = 0;

    let entries: Record<string, Uint8Array>;
    try {
        entries = unzipSync(data, {
            filter: (file) => {
                if (isUnsafeEntryName(file.name)) {
                    rejected.push(file.name);
                    return false;
                }
                if (file.name.endsWith("/")) return false;
                if (++entryCount > MAX_FILES) {
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
        throw new PluginError(`zip 解压失败：${err instanceof Error ? err.message : String(err)}`);
    }

    if (rejected.length) {
        throw new PluginError(`zip 中存在被拒绝的条目：${rejected.slice(0, 3).join("、")}${rejected.length > 3 ? " 等" : ""}`);
    }

    const result = new Map<string, Uint8Array>();
    for (const [name, bytes] of Object.entries(entries)) {
        const path = normalizePath(name);
        if (path) result.set(path, bytes);
    }
    return result;
}

/** 把已安装的插件重新打包成 zip，供用户在多台设备间搬运。 */
export function zipPlugin(files: readonly PluginFile[]): Uint8Array {
    const payload: Record<string, Uint8Array> = {};
    for (const file of files) {
        const path = normalizePath(file.path);
        if (!path || path.endsWith("/")) continue;
        payload[path] = file.kind === "text" ? strToU8(file.text) : new Uint8Array(file.bytes);
    }
    return zipSync(payload, { level: 6 });
}

export function decodeText(bytes: Uint8Array): string {
    return decoder.decode(bytes);
}
