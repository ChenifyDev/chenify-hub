import { type ComponentType } from "react";
import type { PluginSdk, PluginSlot, PluginSlotComponentOf } from "./types";
export declare const plugin: PluginSdk;
export declare function usePluginUI<S extends PluginSlot>(slot: S): PluginSlotComponentOf<S> | undefined;
export declare function useHostUI<S extends PluginSlot>(slot: S): PluginSlotComponentOf<S> | undefined;
export declare function withPluginUI<S extends PluginSlot, P extends object>(
    slot: S,
    Fallback: ComponentType<P>,
): ComponentType<P>;
export type {
    AnySlotComponent,
    PluginSlot,
    PluginSlotComponentOf,
    PluginSlotComponents,
    PluginSdk,
    SlotProps,
} from "./types";
