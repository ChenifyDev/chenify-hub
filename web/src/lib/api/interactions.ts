import { request } from "./http";

type Like = { liked: boolean; likes_count: number };
type Favorite = { favorited: boolean; favorites_count: number };
type Follow = { following: boolean; followers_count: number };

const flip = <T>(url: string, method: "POST" | "DELETE") => request<T>(url, { method });

export const toggleLike = (postId: number) => flip<Like>(`/posts/${postId}/like`, "POST");
export const unLike = (postId: number) => flip<Like>(`/posts/${postId}/like`, "DELETE");

export const toggleFavorite = (postId: number) => flip<Favorite>(`/posts/${postId}/favorite`, "POST");
export const unFavorite = (postId: number) => flip<Favorite>(`/posts/${postId}/favorite`, "DELETE");

export const toggleFollow = (userId: number) => flip<Follow>(`/users/${userId}/follow`, "POST");
export const unFollow = (userId: number) => flip<Follow>(`/users/${userId}/follow`, "DELETE");
