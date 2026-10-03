import type {
    FollowUser,
    HiddenPaginated,
    Page,
    Paginated,
    PointsUser,
    Post,
    RankPaginated,
    SpaceSkeleton,
    UserPublic,
} from "./types";
import { qs, request } from "./http";

export function getSpace(userId: number): Promise<SpaceSkeleton> {
    return request<SpaceSkeleton>(`/users/${userId}/space`);
}

export function getSpacePosts(userId: number, offset = 0, limit = 20): Promise<Paginated<Post>> {
    return request<Paginated<Post>>(`/users/${userId}/space/posts${qs({ offset, limit })}`);
}

export function getSpaceFavorites(userId: number, offset = 0, limit = 20): Promise<HiddenPaginated<Post>> {
    return request<HiddenPaginated<Post>>(`/users/${userId}/space/favorites${qs({ offset, limit })}`);
}

export function getSpaceFollowing(userId: number, offset = 0, limit = 20): Promise<HiddenPaginated<FollowUser>> {
    return request<HiddenPaginated<FollowUser>>(`/users/${userId}/space/following${qs({ offset, limit })}`);
}

export function getSpaceFollowers(userId: number, offset = 0, limit = 20): Promise<HiddenPaginated<FollowUser>> {
    return request<HiddenPaginated<FollowUser>>(`/users/${userId}/space/followers${qs({ offset, limit })}`);
}

export function updatePrivacy(flags: {
    is_favorites_public?: boolean;
    is_follows_public?: boolean;
}): Promise<{ success: boolean }> {
    return request<{ success: boolean }>("/user/privacy", { method: "PATCH", body: JSON.stringify(flags) });
}

export function updateProfile(options: {
    username?: string;
    avatar?: File | null;
    removeAvatar?: boolean;
}): Promise<UserPublic> {
    const form = new FormData();
    if (options.username) form.set("username", options.username);
    if (options.avatar) form.set("avatar", options.avatar);
    if (options.removeAvatar) form.set("remove_avatar", "1");
    return request<UserPublic>("/user/profile", { method: "PATCH", body: form });
}

export function rankUsersByFollowers({ offset, limit }: Page): Promise<RankPaginated<FollowUser>> {
    return request<RankPaginated<FollowUser>>(`/rank/followers${qs({ offset, limit })}`);
}

export function rankUsersByPostPoints({ offset, limit }: Page): Promise<RankPaginated<PointsUser>> {
    return request<RankPaginated<PointsUser>>(`/rank/post/points${qs({ offset, limit })}`);
}

export function searchUsers({ offset, limit, keyword }: Page & { keyword: string }): Promise<Paginated<FollowUser>> {
    return request<Paginated<FollowUser>>(`/search${qs({ offset, limit, type: "users", keyword })}`);
}
