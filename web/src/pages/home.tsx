import { useCallback } from "react";
import { Signpost } from "lucide-react";

import FeedList from "@/components/forum/FeedList.tsx";
import { Page, PageHeader } from "@/components/layout/Page.tsx";
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
        <Page>
            <PageHeader icon={Signpost} title="我的关注" description="查看你关注的用户的动态" />
            <FeedList feed={feed}>{(post) => <PostCard key={post.id} post={post} />}</FeedList>
        </Page>
    );
}
