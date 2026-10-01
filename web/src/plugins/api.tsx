import { Component, type ComponentType, type ReactNode, createElement } from "react";

import { usePluginStore } from "./store.ts";
import type { PluginSdk } from "./sdk-types.ts";
import type { PluginSlot, PluginSlotComponentOf } from "./slots.ts";

/**
 * 当前插件的宿主能力。
 *
 * 这里只有类型、没有运行时值：resolver.ts 在插件 require("@/plugins/api") 时
 * 用当前插件的 sdk 覆盖这个导出（同一份模块表还提供 useHostUI / usePluginUI）。
 * 声明它纯粹是为了让 `import { plugin } from "@/plugins/api"` 在插件里有完整类型。
 */
export declare const plugin: PluginSdk;

/**
 * 宿主每个组件插槽的默认实现。
 *
 * 插件组件若需要在其之上继续包装，必须用 useHostUI(slot) 拿这里的原始实现，
 * 而不是从 "@/components/ui/*" import —— 后者拿到的是已被插件替换过的版本，
 * 直接再赋回同一插槽会形成无限递归。
 *
 * 存的是宽类型：55 个插槽的组件类型互不相同，统一的只有「任意 props 都能收」。
 */
const hostDefaults = new Map<PluginSlot, ComponentType<never>>();

/** 当前生效的插件替换组件；没有插件覆盖该插槽时为 undefined。 */
export function usePluginUI<S extends PluginSlot>(slot: S): PluginSlotComponentOf<S> | undefined {
    return usePluginStore((state) => state.overrides[slot]?.component) as PluginSlotComponentOf<S> | undefined;
}

/** 宿主组件的默认实现，供插件在其之上组合。 */
export function useHostUI<S extends PluginSlot>(slot: S): PluginSlotComponentOf<S> | undefined {
    return hostDefaults.get(slot) as PluginSlotComponentOf<S> | undefined;
}

type SlotBoundaryProps = {
    slot: string;
    pluginId: string;
    pluginName: string;
    fallback: ReactNode;
    children?: ReactNode;
};

type SlotBoundaryState = { failed: boolean };

/**
 * 插件组件渲染抛错时的兜底：记录错误并渲染宿主默认组件。
 * 保证一个坏插件最多让单个组件退化，不会让整页白屏。
 */
class SlotErrorBoundary extends Component<SlotBoundaryProps, SlotBoundaryState> {
    state: SlotBoundaryState = { failed: false };

    static getDerivedStateFromError(): SlotBoundaryState {
        return { failed: true };
    }

    componentDidCatch(error: Error): void {
        usePluginStore.getState().addError({
            pluginId: this.props.pluginId,
            pluginName: this.props.pluginName,
            slot: this.props.slot,
            message: error.message || String(error),
            at: Date.now(),
        });
    }

    render(): ReactNode {
        return this.state.failed ? this.props.fallback : this.props.children;
    }
}

/**
 * 把宿主组件包成可被插件替换的插槽。
 *
 * 在 ui/*.tsx 的模块顶层调用一次即可。返回的组件身份在整个应用生命周期内稳定，
 * 因此只有插槽真正被替换时才会发生子树切换，输入框之类的局部状态不会莫名丢失。
 */
export function withPluginUI<S extends PluginSlot, P extends object>(
    slot: S,
    Fallback: ComponentType<P>,
): ComponentType<P> {
    hostDefaults.set(slot, Fallback as ComponentType<never>);

    function PluginUISlot(props: P) {
        const override = usePluginStore((state) => state.overrides[slot]);
        // 覆盖表每次重建 revision 自增，作为 boundary 的 key 让降级状态能够复位。
        const revision = usePluginStore((state) => state.revision);

        if (!override) return createElement(Fallback, props);
        return createElement(
            SlotErrorBoundary,
            {
                key: revision,
                slot,
                pluginId: override.pluginId,
                pluginName: override.pluginName,
                fallback: createElement(Fallback, props),
            },
            createElement(override.component, props as never),
        );
    }

    PluginUISlot.displayName = `withPluginUI(${slot})`;
    return PluginUISlot as ComponentType<P>;
}

// 插件的入口模块。类型从 slots.ts / sdk-types.ts 转出，作者只需要认这一个模块。
export type { PluginSdk } from "./sdk-types.ts";
export type { AnySlotComponent, PluginSlot, PluginSlotComponentOf, PluginSlotComponents, SlotProps } from "./slots.ts";
