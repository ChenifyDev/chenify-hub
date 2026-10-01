import type { ComponentType } from "react";
import type { PluginError as PluginErrorRecord, PluginSlot, StoredPlugin } from "./types";
/** 单个插槽的覆盖信息。记录来源插件，便于渲染出错时定位到具体插件。 */
export type PluginOverrideEntry = {
    component: ComponentType<never>;
    pluginId: string;
    pluginName: string;
};
/** 插槽名 → 覆盖信息。没被任何插件覆盖的插槽不在表里。 */
export type PluginOverrides = Partial<Record<PluginSlot, PluginOverrideEntry>>;
type PluginState = {
    /** IndexedDB 是否已读完；false 时 ui/*.tsx 一律使用默认组件。 */
    ready: boolean;
    /** 数据库读取失败时的消息（隐私模式 / 存储被禁用）。 */
    loadError: string | null;
    plugins: StoredPlugin[];
    overrides: PluginOverrides;
    /** 每次重建覆盖表自增，用来让报错降级后的 ErrorBoundary 能够复位。 */
    revision: number;
    errors: PluginErrorRecord[];
    setOverrides: (overrides: PluginOverrides, errors: PluginErrorRecord[]) => void;
    addError: (error: PluginErrorRecord) => void;
    clearErrors: (pluginId?: string) => void;
    load: () => Promise<void>;
    setPlugins: (plugins: StoredPlugin[]) => void;
    uninstall: (id: string) => Promise<void>;
    setEnabled: (id: string, enabled: boolean) => Promise<void>;
    /** direction: -1 上移，1 下移。同槽位后加载的插件覆盖先加载的。 */
    move: (id: string, direction: -1 | 1) => Promise<void>;
};
export declare const usePluginStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PluginState>>;
export {};
