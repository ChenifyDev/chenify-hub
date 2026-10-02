import type { PostComment } from "./types";
import { qs, request } from "./http";

type Comment = PostComment;
export function listComments(postId: number, offset = 0, limit = 20): Promise<Comment[]> {
    return request<Comment[]>(`/posts/${postId}/comments${qs({ offset, limit })}`);
}

export function createComment(postId: number, content: string, parentId?: number | null): Promise<Comment> {
    return request<Comment>(`/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content, parent_id: parentId ?? null }),
    });
}

export function deleteComment(commentId: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/comments/${commentId}`, { method: "DELETE" });
}

const commentLike = (commentId: number, method: "POST" | "DELETE") =>
    request<{ liked: boolean; likes_count: number }>(`/comments/${commentId}/like`, { method });

export const toggleCommentLike = (commentId: number) => commentLike(commentId, "POST");
export const unCommentLike = (commentId: number) => commentLike(commentId, "DELETE");
