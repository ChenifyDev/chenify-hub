import { useEffect, type ReactNode } from "react";

import {
    WRAPPED_COMPONENTS,
    createGraph,
    initTranspiler,
    loadSlotComponent,
    releaseGraph,
    type PluginGraph,
} from "./resolver.ts";
import { dropPluginStyles, setPluginScope, setPluginStyle } from "./styles.ts";
import { usePluginStore, type PluginOverrideEntry, type PluginOverrides } from "./store.ts";
import { manifestSlotEntries, type PluginError, type StoredPlugin } from "./types.ts";

const loaded = new Map<string, { graph: PluginGraph; fingerprint: string }>();

const fingerprint = ({ manifest, files }: StoredPlugin) =>
    `${manifest.version} ${files.map((f) => `${f.path}:${f.kind === "text" ? f.text.length : f.bytes.byteLength}`).join(" ")}`;

function graphFor(plugin: StoredPlugin): PluginGraph {
    const cached = loaded.get(plugin.id);
    const current = fingerprint(plugin);
    if (cached && cached.fingerprint === current) return cached.graph;

    if (cached) unload(plugin.id);
    const graph = createGraph(plugin.id, plugin.files);
    loaded.set(plugin.id, { graph, fingerprint: current });
    return graph;
}

function unload(pluginId: string): void {
    const cached = loaded.get(pluginId);
    if (cached) releaseGraph(cached.graph);
    loaded.delete(pluginId);
    dropPluginStyles(pluginId);
}

const failure = (plugin: StoredPlugin, slot: string | undefined, err: unknown): PluginError => ({
    pluginId: plugin.id,
    pluginName: plugin.manifest.name,
    slot,
    message: err instanceof Error ? err.message : String(err),
    at: Date.now(),
});

const mountStyles = (plugin: StoredPlugin) => {
    for (const path of plugin.manifest.ui.style) {
        const file = plugin.files.find((f) => f.path === path);
        if (file?.kind === "text") setPluginStyle(plugin.id, `manifest:${path}`, file.text);
    }
};

async function build(plugins: readonly StoredPlugin[]): Promise<{ overrides: PluginOverrides; errors: PluginError[] }> {
    const enabled = plugins.filter((plugin) => plugin.enabled).sort((a, b) => a.order - b.order);
    const active = new Set(enabled.map((plugin) => plugin.id));
    const overrides: PluginOverrides = {};
    const errors: PluginError[] = [];

    for (const pluginId of loaded.keys()) {
        if (!active.has(pluginId)) unload(pluginId);
    }
    setPluginScope(enabled.map((plugin) => plugin.id));

    for (const plugin of enabled) {
        try {
            const graph = graphFor(plugin);
            mountStyles(plugin);
            const slots = manifestSlotEntries(plugin.manifest);
            if (!slots.length) continue;

            await initTranspiler();
            for (const [slot, path] of slots) {
                try {
                    const component = loadSlotComponent(graph, slot, path, plugin.manifest);
                    if (WRAPPED_COMPONENTS.has(component)) continue;
                    overrides[slot] = {
                        component,
                        pluginId: plugin.id,
                        pluginName: plugin.manifest.name,
                    } as PluginOverrideEntry;
                } catch (err) {
                    errors.push(failure(plugin, slot, err));
                }
            }
        } catch (err) {
            errors.push(failure(plugin, undefined, err));
        }
    }

    return { overrides, errors };
}

export default function PluginRuntime({ children }: { children: ReactNode }) {
    const ready = usePluginStore((state) => state.ready);
    const plugins = usePluginStore((state) => state.plugins);
    const load = usePluginStore((state) => state.load);
    const setOverrides = usePluginStore((state) => state.setOverrides);

    useEffect(() => {
        if (!ready) {
            void load();
            return;
        }
        let cancelled = false;
        void build(plugins).then(({ overrides, errors }) => {
            if (!cancelled) setOverrides(overrides, errors);
        });
        return () => {
            cancelled = true;
        };
    }, [ready, plugins, load, setOverrides]);

    return children;
}
