import { makeStoredPlugin, nextOrder, putPlugin } from "./db.ts";
import { MANIFEST_NAME, PluginError, checkPackageLimits, parseManifest, toFileMap } from "./manifest.ts";
import { readFolderSelection, readRemotePlugin, readZipFile } from "./source.ts";
import { usePluginStore } from "./store.ts";
import type { PluginFile, PluginInstallSource, PluginManifest } from "./types.ts";

/** 安装前的公共校验：体积上限 → 找 plugin.json → 解析并校验 manifest。 */
function prepare(files: PluginFile[]): { manifest: PluginManifest; files: PluginFile[] } {
    checkPackageLimits(files);
    const map = toFileMap(files);
    const raw = map.get(MANIFEST_NAME);
    if (!raw || raw.kind !== "text") {
        throw new PluginError(`插件包根目录缺少 ${MANIFEST_NAME}`);
    }
    return { manifest: parseManifest(raw.text, map), files: [...map.values()] };
}

/** 校验并写入 IndexedDB。已存在同 id 插件时保留其启用状态与排序位置。 */
export async function installFiles(files: PluginFile[], source: PluginInstallSource): Promise<PluginManifest> {
    const { manifest, files: normalized } = prepare(files);
    const existing = usePluginStore.getState().plugins;
    const previous = existing.find((plugin) => plugin.id === manifest.id);
    const now = Date.now();

    const record = makeStoredPlugin(manifest, normalized, previous?.order ?? nextOrder(existing), source, now);
    record.installedAt = previous?.installedAt ?? now;
    record.enabled = previous?.enabled ?? true;

    await putPlugin(record);
    usePluginStore.getState().setPlugins(
        previous ? existing.map((plugin) => (plugin.id === manifest.id ? record : plugin)) : [...existing, record],
    );
    return manifest;
}

export async function installFromFolder(selection: FileList | File[]): Promise<PluginManifest> {
    return installFiles(await readFolderSelection(selection), "folder");
}

export async function installFromZip(file: File): Promise<PluginManifest> {
    return installFiles(await readZipFile(file), "zip");
}

export async function installFromUrl(url: string): Promise<PluginManifest> {
    return installFiles(await readRemotePlugin(url), "url");
}
