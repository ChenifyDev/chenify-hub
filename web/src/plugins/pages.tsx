import { createElement } from "react";
import { useParams } from "react-router-dom";

import { SlotErrorBoundary } from "./api.ts";
import { usePluginStore } from "./store.ts";
import RequireAuth from "@/components/RequireAuth.tsx";
import NotFound from "@/pages/NotFound";

function PageErrorFallback() {
    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-sm font-medium text-foreground">插件页面渲染失败</p>
            <p className="text-sm text-muted-foreground">
                已降级为该页面的错误提示，详情见「插件」管理页的运行时错误列表。
            </p>
        </div>
    );
}

/**
 * `/plugin/*` 分发器。
 *
 * 路由树在模块加载期就固定了（createBrowserRouter），这里不往里塞动态路由，
 * 而是用一条 splat 路由把剩余路径交给已注册的插件页面精确匹配 ——
 * 插件启停即时生效，卸载后地址直接落到 NotFound。
 */
export default function PluginPagesRoute() {
    const splat = useParams()["*"] ?? "";
    const pages = usePluginStore((state) => state.pages);
    const revision = usePluginStore((state) => state.revision);
    const page = pages.find((entry) => entry.path === splat);

    if (!page) return <NotFound />;

    const content = (
        <SlotErrorBoundary
            key={`${page.pluginId}:${page.path}:${revision}`}
            error={{ pluginId: page.pluginId, pluginName: page.pluginName, slot: `page:${page.path}` }}
            fallback={<PageErrorFallback />}
        >
            {createElement(page.component)}
        </SlotErrorBoundary>
    );

    return page.auth ? <RequireAuth>{content}</RequireAuth> : content;
}
