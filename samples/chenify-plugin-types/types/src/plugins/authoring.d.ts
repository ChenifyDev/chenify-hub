/**
 * 插件作者的公开类型入口。
 *
 * 运行时没有这个模块：resolver.ts 用一张白名单模块表接管插件的 require，
 * 插件 `import { useHostUI } from "@/plugins/api"` 拿到的其实是 api.tsx 里的东西。
 * 这里只是把作者要用的东西集中转出一遍，好让 tsconfig.plugin-types.json 以它为入口
 * 生成 .d.ts（scripts/gen-plugin-types.ts），类型来源也因此收敛到一处。
 *
 * 注意 react / clsx / @base-ui/react/* / lucide-react 这些是包里真实存在的依赖，
 * 作者自己 npm i 就行，不需要在这里转出。
 *
 * cn 在运行时住在 "@/lib/utils"（resolver.ts 的模块表是这么给的），这里转出它
 * 纯粹是为了让声明图里有 lib/utils.d.ts —— 作者那边 "@/lib/utils" 才解析得到。
 */
export { useHostUI, usePluginUI } from "./api";
export type { PluginSdk } from "./sdk-types";
export type { AnySlotComponent, PluginSlot, PluginSlotComponentOf, PluginSlotComponents, SlotProps } from "./slots";
export { cn } from "@/lib/utils";
