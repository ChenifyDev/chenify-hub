import type { Context, MiddlewareHandler, Next } from "hono";

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

interface RateLimitOptions {
    windowMs: number;
    max: number;
    key?: (c: Context) => string;
    message?: string;
}

const DEFAULT_KEY = (c: Context): string => {
    return c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? c.req.header("x-real-ip") ?? "unknown";
};

export function createRateLimit(options: RateLimitOptions): MiddlewareHandler {
    const { windowMs, max, key = DEFAULT_KEY, message = "请求过于频繁，请稍后再试" } = options;
    const store = new Map<string, RateLimitEntry>();

    const cleanup = setInterval(() => {
        const now = Date.now();
        for (const [k, v] of store) {
            if (v.resetAt <= now) store.delete(k);
        }
    }, windowMs * 2);
    if (typeof cleanup === "object" && "unref" in cleanup) {
        cleanup.unref();
    }

    return async (c: Context, next: Next) => {
        const id = key(c);
        const now = Date.now();
        let entry = store.get(id);

        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            store.set(id, entry);
        }

        entry.count++;

        const remaining = Math.max(0, max - entry.count);
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

        c.header("X-RateLimit-Limit", String(max));
        c.header("X-RateLimit-Remaining", String(remaining));
        c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

        if (entry.count > max) {
            c.header("Retry-After", String(retryAfter));
            return c.json({ message, retryAfter }, 429);
        }

        await next();
    };
}

const strict = createRateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: "操作过于频繁，请 15 分钟后再试" });
const login = createRateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "登录尝试过多，请 15 分钟后再试" });
const write = createRateLimit({ windowMs: 60 * 1000, max: 10, message: "发送内容过于频繁，请稍后再试" });
const interact = createRateLimit({ windowMs: 60 * 1000, max: 30, message: "操作过于频繁，请稍后再试" });
const follow = createRateLimit({ windowMs: 60 * 1000, max: 20, message: "关注操作过于频繁，请稍后再试" });
const read = createRateLimit({ windowMs: 60 * 1000, max: 120, message: "请求过于频繁，请稍后再试" });
const oauth = createRateLimit({ windowMs: 60 * 1000, max: 60, message: "请求过于频繁，请稍后再试" });

function pick(path: string, method: string): MiddlewareHandler {
    if (path === "/api/auth/register") return strict;
    if (path === "/api/auth/login") return login;

    if (path === "/api/posts" && method === "POST") return write;
    if (/^\/api\/posts\/\d+\/draft$/.test(path) && method === "POST") return write;
    if (/^\/api\/posts\/\d+\/comment-area$/.test(path)) return write;
    if (/^\/api\/posts\/\d+\/pin$/.test(path)) return write;
    if (/^\/api\/posts\/\d+$/.test(path) && (method === "PATCH" || method === "DELETE")) return write;
    if (path === "/api/drafts" && method === "POST") return write;
    if (/^\/api\/drafts\/\d+$/.test(path) && (method === "PATCH" || method === "DELETE")) return write;
    if (/^\/api\/drafts\/\d+\/publish$/.test(path)) return write;
    if (/^\/api\/drafts\/\d+\/unpublish$/.test(path)) return write;
    if (path === "/api/user/profile" && method === "PATCH") return write;

    if (/^\/api\/posts\/\d+\/like$/.test(path)) return interact;
    if (/^\/api\/posts\/\d+\/coin$/.test(path)) return interact;
    if (/^\/api\/posts\/\d+\/favorite$/.test(path)) return interact;
    if (/^\/api\/comments\/\d+\/like$/.test(path)) return interact;
    if (/^\/api\/comments\/\d+$/.test(path) && method === "DELETE") return interact;

    if (/^\/api\/users\/\d+\/follow$/.test(path)) return follow;
    if (/^\/api\/user\/privacy$/.test(path) && method === "PATCH") return follow;

    if (/^\/oauth\//.test(path)) return oauth;
    if (/^\/\.well-known\//.test(path)) return oauth;

    return read;
}

export async function rateLimit(c: Context, next: Next): Promise<void> {
    const path = new URL(c.req.url).pathname;
    const limiter = pick(path, c.req.method);
    await limiter(c, next);
}
