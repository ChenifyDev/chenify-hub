declare module "virtual:chenify-plugin-host" {
    /**
     * @base-ui/react 的全部公开子路径，值为动态 import 工厂。
     * 由 vite.config.ts 中的 chenify:plugin-host-modules 插件在构建时生成。
     */
    export const baseUiModules: Record<string, () => Promise<unknown>>;

    /** 应用自身已用到的 lucide 图标，已在主包里，插件直接用这些是零成本的。 */
    export const lucideStaticModules: Record<string, unknown>;

    /**
     * 加载应用没用到的图标长尾，单独一个 chunk，约 90KB gzip，只加载一次。
     * 不能改成 import("lucide-react")：那是命名空间导入，会把全部图标标记为已使用，
     * 而 lucide-react.mjs 已在主包里，于是这六百多 KB 会赖在主包里不走。
     */
    export const loadLucideIcons: () => Promise<unknown>;
}
