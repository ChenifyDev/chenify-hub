import { Component, createElement, type ComponentType, type ReactNode } from "react";

import { usePluginStore } from "./store.ts";
import type { PluginError, PluginSdk, PluginSlot, PluginSlotComponentOf } from "./types.ts";

export declare const plugin: PluginSdk;

const hostDefaults = new Map<PluginSlot, ComponentType<never>>();

export function usePluginUI<S extends PluginSlot>(slot: S): PluginSlotComponentOf<S> | undefined {
    return usePluginStore((state) => state.overrides[slot]?.component) as PluginSlotComponentOf<S> | undefined;
}

export function useHostUI<S extends PluginSlot>(slot: S): PluginSlotComponentOf<S> | undefined {
    return hostDefaults.get(slot) as PluginSlotComponentOf<S> | undefined;
}

type BoundaryProps = {
    error: Omit<PluginError, "message" | "at">;
    fallback: ReactNode;
    children?: ReactNode;
};

class SlotErrorBoundary extends Component<BoundaryProps, { failed: boolean }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error: Error) {
        usePluginStore.getState().addError({ ...this.props.error, message: error.message, at: Date.now() });
    }

    render() {
        return this.state.failed ? this.props.fallback : this.props.children;
    }
}

export function withPluginUI<S extends PluginSlot, P extends object>(
    slot: S,
    Fallback: ComponentType<P>,
): ComponentType<P> {
    hostDefaults.set(slot, Fallback as ComponentType<never>);

    function PluginUISlot(props: P) {
        const override = usePluginStore((state) => state.overrides[slot]);
        const revision = usePluginStore((state) => state.revision);
        if (!override) return createElement(Fallback, props);

        const { pluginId, pluginName } = override;
        return createElement(
            SlotErrorBoundary,
            { key: revision, error: { pluginId, pluginName, slot }, fallback: createElement(Fallback, props) },
            createElement(override.component, props as never),
        );
    }

    PluginUISlot.displayName = `withPluginUI(${slot})`;
    return PluginUISlot as ComponentType<P>;
}

export type {
    AnySlotComponent,
    PluginSlot,
    PluginSlotComponentOf,
    PluginSlotComponents,
    PluginSdk,
    SlotProps,
} from "./types.ts";
