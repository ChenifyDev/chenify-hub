import { useCallback } from "react";

import FeedList from "@/components/forum/FeedList.tsx";
import UserRow from "@/components/user/UserRow.tsx";
import { searchUsers, type FollowUser } from "@/lib/api";
import { useInfiniteList } from "@/hooks/useInfiniteList.ts";
import { formatDate } from "@/lib/format.ts";

const LIMIT = 10;

export default function UsersTab({ keyword }: { keyword: string }) {
    const feed = useInfiniteList<FollowUser>({
        fetcher: useCallback(
            async (offset, limit) => {
                const res = await searchUsers({ offset, limit, keyword });
                return { items: res.items, hasMore: res.hasMore, hidden: false };
            },
            [keyword],
        ),
        limit: LIMIT,
    });

    return (
        <FeedList feed={feed} empty="没有找到相关用户">
            {(user) => (
                <UserRow
                    key={user.id}
                    user={user}
                    onFollowChange={(updated) =>
                        feed.setItems((items) => items.map((u) => (u.id === updated.id ? updated : u)))
                    }
                >
                    <span className="text-xs text-muted-foreground">{formatDate(user.created_at)} 加入</span>
                </UserRow>
            )}
        </FeedList>
    );
}
