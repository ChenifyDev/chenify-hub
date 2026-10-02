import type { Draft, Paginated, Post } from "./types";
import { qs, request } from "./http";

export function createDraft(content: string, images: File[], tags: string[]): Promise<Draft> {
    const form = new FormData();
    form.set("content", content);
    form.set("tags", tags.join(","));
    for (const image of images) form.append("images", image);
    return request<Draft>("/drafts", { method: "POST", body: form });
}

export function updateDraft(id: number, content: string, images: File[], tags: string[]): Promise<Draft> {
    const form = new FormData();
    form.set("content", content);
    form.set("tags", tags.join(","));
    for (const image of images) form.append("images", image);
    return request<Draft>(`/drafts/${id}`, { method: "PATCH", body: form });
}

export function listDrafts(status?: "draft" | "published", offset = 0, limit = 20): Promise<Paginated<Draft>> {
    return request<Paginated<Draft>>(`/drafts${qs({ status, offset, limit })}`);
}

export function getDraft(id: number): Promise<Draft> {
    return request<Draft>(`/drafts/${id}`);
}

export function publishDraft(id: number): Promise<Post> {
    return request<Post>(`/drafts/${id}/publish`, { method: "POST" });
}

export function unpublishDraft(id: number): Promise<Draft> {
    return request<Draft>(`/drafts/${id}/unpublish`, { method: "POST" });
}

export function deleteDraft(id: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/drafts/${id}`, { method: "DELETE" });
}
