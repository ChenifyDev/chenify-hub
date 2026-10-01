import { create } from "zustand";
import type { ComponentType } from "react";

import { deletePlugin, listPlugins, putPlugins } from "./db.ts";
import type { PluginError as PluginErrorRecord, PluginSlot, StoredPlugin } from "./types.ts";

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

export const usePluginStore = create<PluginState>((set, get) => ({
    ready: false,
    loadError: null,
    plugins: [],
    overrides: {},
    revision: 0,
    errors: [],

    setOverrides: (overrides, errors) => set((state) => ({ overrides, revision: state.revision + 1, errors })),
    addError: (error) => set((state) => ({ errors: [...state.errors, error].slice(-20) })),
    clearErrors: (pluginId) =>
        set((state) => ({ errors: pluginId ? state.errors.filter((error) => error.pluginId !== pluginId) : [] })),

    load: async () => {
        try {
            const plugins = await listPlugins();
            set({ plugins, ready: true, loadError: null });
        } catch (err) {
            set({ ready: true, loadError: err instanceof Error ? err.message : "读取插件列表失败" });
        }
    },

    setPlugins: (plugins) => set({ plugins: [...plugins].sort((a, b) => a.order - b.order) }),

    uninstall: async (id) => {
        await deletePlugin(id);
        set((state) => ({ plugins: state.plugins.filter((plugin) => plugin.id !== id) }));
    },

    setEnabled: async (id, enabled) => {
        const plugins = get().plugins.map((plugin) =>
            plugin.id === id ? { ...plugin, enabled, updatedAt: Date.now() } : plugin,
        );
        set({ plugins });
        await putPlugins(plugins);
    },

    move: async (id, direction) => {
        const sorted = [...get().plugins].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex((plugin) => plugin.id === id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= sorted.length) return;
        [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
        const plugins = sorted.map((plugin, order) => ({ ...plugin, order }));
        set({ plugins });
        await putPlugins(plugins);
    },
}));
