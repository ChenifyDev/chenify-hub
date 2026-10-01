import type { PluginFile, PluginInstallSource, PluginManifest, StoredPlugin } from "./types";
export declare function listPlugins(): Promise<StoredPlugin[]>;
export declare function getPlugin(id: string): Promise<StoredPlugin | null>;
export declare function putPlugin(plugin: StoredPlugin): Promise<void>;
export declare function putPlugins(plugins: readonly StoredPlugin[]): Promise<void>;
export declare function deletePlugin(id: string): Promise<void>;
/** 新记录的 order 追加到末尾。 */
export declare function nextOrder(plugins: readonly StoredPlugin[]): number;
export declare function makeStoredPlugin(manifest: PluginManifest, files: PluginFile[], order: number, source: PluginInstallSource, now: number): StoredPlugin;
