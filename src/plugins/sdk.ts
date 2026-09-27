import { toast } from "sonner";

import router from "@/router";
import { useUserStore } from "@/stores/useUser.ts";
import { PLUGIN_SLOTS } from "./types.ts";

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
    readonly slots: readonly string[];
    /** 站点信息。 */
    readonly site: { readonly name: string; readonly origin: string };
    /** 站内跳转，只接受以单个 "/" 开头的路径。 */
    navigate: (to: string) => void;
    /** 轻提示。 */
    toast: {
        message: (text: string) => void;
        success: (text: string) => void;
        error: (text: string) => void;
    };
    /** 当前登录用户，未登录时为 null。 */
    currentUser: () => { id: number; username: string; avatar: string | undefined } | null;
    /** 插件私有存储，自动加 `plugin:<id>:` 前缀。 */
    storage: {
        get: (key: string) => string | null;
        set: (key: string, value: string) => void;
        remove: (key: string) => void;
    };
};

function createStorage(prefix: string): PluginSdk["storage"] {
    return {
        get: (key) => {
            try {
                return localStorage.getItem(`${prefix}${key}`);
            } catch {
                return null;
            }
        },
        set: (key, value) => {
            try {
                localStorage.setItem(`${prefix}${key}`, value);
            } catch {
                toast.error("插件存储写入失败（可能已超出浏览器配额）");
            }
        },
        remove: (key) => {
            try {
                localStorage.removeItem(`${prefix}${key}`);
            } catch {
                /* 忽略 */
            }
        },
    };
}

export function createPluginSdk(manifest: { id: string; name: string; version: string }): PluginSdk {
    return {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        slots: PLUGIN_SLOTS,
        site: { name: "ChenifyHub", origin: window.location.origin },
        navigate: (to) => {
            // 只允许站内绝对路径，拒绝 "//evil.com" 这类协议相对地址。
            if (typeof to !== "string" || !to.startsWith("/") || to.startsWith("//")) return;
            void router.navigate(to);
        },
        toast: {
            message: (text) => toast.message(text),
            success: (text) => toast.success(text),
            error: (text) => toast.error(text),
        },
        currentUser: () => {
            const user = useUserStore.getState().user;
            return user ? { id: user.id, username: user.username, avatar: user.avatar } : null;
        },
        storage: createStorage(`plugin:${manifest.id}:`),
    };
}
