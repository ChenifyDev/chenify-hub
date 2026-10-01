/**
 * 插件能拿到的宿主能力的类型声明。
 *
 * 单独一个模块、且只有类型，是为了让「只要 PluginSdk 类型」的地方不必把应用拖进来：
 * 生成插件类型包（tsconfig.plugin-types.json）以类型可达的模块为入口，
 * 而 sdk.ts 依赖 @/router 与各个 store，一旦可达就会把整棵应用源码 emit 成 d.ts。
 */
import type { PluginSlot } from "./types";
/**
 * 插件可以拿到的宿主能力。
 *
 * 这里刻意不暴露 fetch、localStorage 原始接口与登录 token —— 插件的定位是美化 UI，
 * 而不是读写社区数据。插件自用的键值存储会自动加上 `plugin:<id>:` 前缀。
 */
export type PluginSdk = {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    /** 全部可替换的插槽名。 */
    readonly slots: readonly PluginSlot[];
    /** 站点信息。 */
    readonly site: {
        readonly name: string;
        readonly origin: string;
    };
    /** 站内跳转，只接受以单个 "/" 开头的路径。 */
    navigate: (to: string) => void;
    /** 轻提示。 */
    toast: {
        message: (text: string) => void;
        success: (text: string) => void;
        error: (text: string) => void;
    };
    /** 当前登录用户，未登录时为 null。 */
    currentUser: () => {
        id: number;
        username: string;
        avatar: string | undefined;
    } | null;
    /** 插件私有存储，自动加 `plugin:<id>:` 前缀。 */
    storage: {
        get: (key: string) => string | null;
        set: (key: string, value: string) => void;
        remove: (key: string) => void;
    };
};
export type { PluginSlot };
