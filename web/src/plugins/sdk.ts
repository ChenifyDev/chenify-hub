import { toast } from "sonner";

import router from "@/router";
import { useUserStore } from "@/stores/useUser.ts";
import { PLUGIN_SLOTS } from "./types.ts";
import type { PluginSdk } from "./sdk-types.ts";

// 类型契约在 sdk-types.ts，这里转出以保持原有的 import 路径可用
export type { PluginSdk };

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
