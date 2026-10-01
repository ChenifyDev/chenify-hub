import type { StoredPlugin } from "./types";
export declare function listPlugins(): Promise<StoredPlugin[]>;
export declare function putPlugin(plugin: StoredPlugin): Promise<void>;
export declare function putPlugins(plugins: readonly StoredPlugin[]): Promise<void>;
export declare function deletePlugin(id: string): Promise<void>;
