/**
 * `plugin.navigate(to)` 的实现。
 *
 * 惰性 import 路由器：resolver 在模块求值期就能拿到本函数，
 * 但此时引入 router/index.tsx 会形成模块环（router → 插件页面分发器 → store）。
 */
const SITE_PATH = /^\/(?!\/)/;

export function navigate(to: string): void {
    if (typeof to !== "string" || !SITE_PATH.test(to)) return;
    void import("../router/index.tsx")
        .then((module) => module.default.navigate(to))
        .catch(() => {});
}
