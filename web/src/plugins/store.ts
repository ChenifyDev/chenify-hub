import { create } from "zustand";
import type { ComponentType } from "react";

import { deletePlugin, listPlugins, putPlugins } from "./db.ts";
import type { PluginError, PluginSlot, StoredPlugin } from "./types.ts";

export type PluginOverrideEntry = {
    component: ComponentType<never>;
    pluginId: string;
    pluginName: string;
};

export type PluginOverrides = Partial<Record<PluginSlot, PluginOverrideEntry>>;

type PluginState = {
    ready: boolean;
    loadError: string | null;
    plugins: StoredPlugin[];
    overrides: PluginOverrides;
    revision: number;
    errors: PluginError[];
    setOverrides: (overrides: PluginOverrides, errors: PluginError[]) => void;
    addError: (error: PluginError) => void;
    clearErrors: (pluginId?: string) => void;
    load: () => Promise<void>;
    setPlugins: (plugins: StoredPlugin[]) => void;
    uninstall: (id: string) => Promise<void>;
    setEnabled: (id: string, enabled: boolean) => Promise<void>;
    move: (id: string, direction: -1 | 1) => Promise<void>;
};

export const usePluginStore = create<PluginState>((set, get) => {
    const commit = async (plugins: StoredPlugin[]) => {
        set({ plugins });
        await putPlugins(plugins);
    };

    return {
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
                set({ plugins: await listPlugins(), ready: true, loadError: null });
            } catch (err) {
                set({ ready: true, loadError: err instanceof Error ? err.message : "读取插件列表失败" });
            }
        },

        setPlugins: (plugins) => set({ plugins: [...plugins].sort((a, b) => a.order - b.order) }),

        uninstall: async (id) => {
            await deletePlugin(id);
            set((state) => ({ plugins: state.plugins.filter((plugin) => plugin.id !== id) }));
        },

        setEnabled: (id, enabled) =>
            commit(
                get().plugins.map((plugin) =>
                    plugin.id === id ? { ...plugin, enabled, updatedAt: Date.now() } : plugin,
                ),
            ),

        move: async (id, direction) => {
            const sorted = [...get().plugins].sort((a, b) => a.order - b.order);
            const index = sorted.findIndex((plugin) => plugin.id === id);
            const target = index + direction;
            if (index < 0 || target < 0 || target >= sorted.length) return;
            [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
            await commit(sorted.map((plugin, order) => ({ ...plugin, order })));
        },
    };
});
