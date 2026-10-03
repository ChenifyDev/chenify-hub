import { useUserStore } from "@/stores/useUser.ts";
import { clearToken, getToken } from "./token";

export function getApiBase(): string {
    return (import.meta.env.VITE_API_PATH as string | undefined) ?? "";
}

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
    }
    const text = query.toString();
    return text ? `?${text}` : "";
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = getToken();
    const res = await fetch(`${getApiBase()}/api${path}`, {
        ...init,
        headers: {
            ...(typeof init?.body === "string" ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...init?.headers,
        },
    });

    const data = (await res.json().catch(() => null)) as { message?: string } | null;

    if (res.status === 401 && token) {
        clearToken();
        useUserStore.getState().setUser(null);
    }
    if (!res.ok) throw new ApiError(data?.message ?? `请求失败（${res.status}）`, res.status);

    return data as T;
}
