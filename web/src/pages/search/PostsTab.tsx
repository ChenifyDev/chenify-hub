import { useCallback } from "react";

import FeedList from "@/components/forum/FeedList.tsx";
import PostCard from "@/components/forum/PostCard.tsx";
import { searchPosts, type Post } from "@/lib/api";
import { useInfiniteList } from "@/hooks/useInfiniteList.ts";

const LIMIT = 10;

export default function PostsTab({ keyword, sort }: { keyword: string; sort: "hot" | "latest" }) {
    const feed = useInfiniteList<Post>({
        fetcher: useCallback(
            async (offset, limit) => {
                const res = await searchPosts({ offset, limit, sort, keyword });
                return { items: res.items, hasMore: res.hasMore, hidden: false };
            },
            [keyword, sort],
        ),
        limit: LIMIT,
    });

    return (
        <FeedList feed={feed} empty="没有找到相关帖子">
            {(post) => <PostCard key={post.id} post={post} />}
        </FeedList>
    );
}
