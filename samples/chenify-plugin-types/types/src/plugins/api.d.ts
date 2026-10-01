import { type ComponentType } from "react";
import type { PluginSdk } from "./sdk-types";
import type { PluginSlot, PluginSlotComponentOf } from "./slots";
/**
 * 当前插件的宿主能力。
 *
 * 这里只有类型、没有运行时值：resolver.ts 在插件 require("@/plugins/api") 时
 * 用当前插件的 sdk 覆盖这个导出（同一份模块表还提供 useHostUI / usePluginUI）。
 * 声明它纯粹是为了让 `import { plugin } from "@/plugins/api"` 在插件里有完整类型。
 */
export declare const plugin: PluginSdk;
/** 当前生效的插件替换组件；没有插件覆盖该插槽时为 undefined。 */
export declare function usePluginUI<S extends PluginSlot>(slot: S): PluginSlotComponentOf<S> | undefined;
/** 宿主组件的默认实现，供插件在其之上组合。 */
export declare function useHostUI<S extends PluginSlot>(slot: S): PluginSlotComponentOf<S> | undefined;
/**
 * 把宿主组件包成可被插件替换的插槽。
 *
 * 在 ui/*.tsx 的模块顶层调用一次即可。返回的组件身份在整个应用生命周期内稳定，
 * 因此只有插槽真正被替换时才会发生子树切换，输入框之类的局部状态不会莫名丢失。
 */
export declare function withPluginUI<S extends PluginSlot, P extends object>(slot: S, Fallback: ComponentType<P>): ComponentType<P>;
export type { PluginSdk } from "./sdk-types";
export type { AnySlotComponent, PluginSlot, PluginSlotComponentOf, PluginSlotComponents, SlotProps } from "./slots";
