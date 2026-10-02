import { useCallback } from "react";
import { Signpost } from "lucide-react";

import FeedList from "@/components/forum/FeedList.tsx";
import PostCard from "@/components/forum/PostCard.tsx";
import { listFollowingPosts, type Post } from "@/lib/api";
import { useInfiniteList } from "@/hooks/useInfiniteList.ts";

const LIMIT = 5;

export function Home() {
    const feed = useInfiniteList<Post>({
        fetcher: useCallback(async (offset) => {
            const list = await listFollowingPosts({ offset, limit: LIMIT });
            return { items: list.posts, hasMore: list.hasMore, hidden: false };
        }, []),
        limit: LIMIT,
    });

    return (
        <div className="mx-auto w-full max-w-3xl px-4">
            <header className="mb-4">
                <h1 className="flex items-center gap-2 text-xl font-semibold">
                    <Signpost className="size-5" />
                    我的关注
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">查看你关注的用户的动态</p>
            </header>
            <FeedList feed={feed}>{(post) => <PostCard key={post.id} post={post} />}</FeedList>
        </div>
    );
}
