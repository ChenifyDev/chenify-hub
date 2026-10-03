import type { UserPublic } from "./types";
import { request } from "./http";

export type LoginResult = { token: string; user: UserPublic };

export function login(account: string, password: string): Promise<LoginResult> {
    return request<LoginResult>("/auth/login", { method: "POST", body: JSON.stringify({ login: account, password }) });
}

export function register(username: string, email: string, password: string, avatar?: File | null): Promise<UserPublic> {
    const form = new FormData();
    form.set("username", username);
    form.set("email", email);
    form.set("password", password);
    if (avatar) form.set("avatar", avatar);
    return request<UserPublic>("/auth/register", { method: "POST", body: form });
}

export function me(): Promise<UserPublic> {
    return request<UserPublic>("/auth/me");
}
