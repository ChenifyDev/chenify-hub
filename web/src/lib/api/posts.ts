import type { Paginated, Post } from "./types";
import { qs, request } from "./http";

export function listPosts(options: {
    offset?: number;
    limit?: number;
    tag?: string | null;
    sort?: "latest" | "hot";
}): Promise<Paginated<Post>> {
    return request<Paginated<Post>>(
        `/posts${qs({ offset: options.offset ?? 0, limit: options.limit ?? 20, tag: options.tag, sort: options.sort })}`,
    );
}

export function getPost(id: number): Promise<Post> {
    return request<Post>(`/posts/${id}`);
}

export function getPostDraft(
    id: number,
): Promise<{ id: number; status: "draft" | "published"; post_id: number | null }> {
    return request<{ id: number; status: "draft" | "published"; post_id: number | null }>(`/posts/${id}/draft`);
}

export function setPostCommentArea(id: number, open: boolean): Promise<Post> {
    return request<Post>(`/posts/${id}/comment-area`, {
        method: "PATCH",
        body: JSON.stringify({ comment_area: open }),
    });
}

export function setPostPinned(id: number, pinned: boolean): Promise<Post> {
    return request<Post>(`/posts/${id}/pin`, {
        method: "PATCH",
        body: JSON.stringify({ pinned }),
    });
}

export function searchPosts({
    offset,
    limit,
    sort,
    keyword,
}: {
    offset: number;
    limit: number;
    sort: "latest" | "hot";
    keyword: string;
}): Promise<Paginated<Post>> {
    return request<Paginated<Post>>(`/search${qs({ offset, limit, type: "posts", keyword, sort })}`);
}
