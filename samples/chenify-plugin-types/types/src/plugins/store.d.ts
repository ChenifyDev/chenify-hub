import type { ComponentType } from "react";
import type { PluginError, PluginSlot, StoredPlugin } from "./types";
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
export declare const usePluginStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PluginState>>;
export {};
