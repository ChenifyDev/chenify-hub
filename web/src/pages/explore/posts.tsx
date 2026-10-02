import { useCallback, useEffect, useState } from "react";
import { Clock, Flame, Signpost } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import PostCard from "@/components/forum/PostCard.tsx";
import FeedList from "@/components/forum/FeedList.tsx";
import { Page, PageHeader } from "@/components/layout/Page.tsx";
import { Button } from "@/components/ui/button.tsx";
import { listPosts, listTags, type Post } from "@/lib/api";
import { cn } from "@/lib/utils.ts";
import { useInfiniteList } from "@/hooks/useInfiniteList.ts";

type Sort = "hot" | "latest";

const LIMIT = 10;

function PostFeed({ sort, tag }: { sort: Sort; tag: string | null }) {
    const feed = useInfiniteList<Post>({
        fetcher: useCallback(
            async (offset) => {
                const res = await listPosts({ offset, limit: LIMIT, tag, sort });
                return { items: res.items, hasMore: res.hasMore, hidden: false };
            },
            [sort, tag],
        ),
        limit: LIMIT,
    });

    return <FeedList feed={feed}>{(post) => <PostCard key={post.id} post={post} />}</FeedList>;
}

export default function Posts() {
    const [params, setParams] = useSearchParams();
    const sort: Sort = params.get("sort") === "latest" ? "latest" : "hot";
    const tag = params.get("tag");
    const [tags, setTags] = useState<string[]>([]);

    const patch = (key: "sort" | "tag", value: string | null) => {
        setParams((prev) => {
            const next = new URLSearchParams(prev);
            if (!value || (key === "sort" && value === "hot")) next.delete(key);
            else next.set(key, value);
            return next;
        });
    };

    useEffect(() => {
        listTags()
            .then(setTags)
            .catch(() => {});
    }, []);

    return (
        <Page>
            <PageHeader icon={Signpost} title="帖子" description="按热度或时间浏览社区里的好内容" />

            <div className="mb-3 flex items-center gap-2">
                <Button size="sm" variant={sort === "hot" ? "default" : "outline"} onClick={() => patch("sort", "hot")}>
                    <Flame />
                    热门
                </Button>
                <Button
                    size="sm"
                    variant={sort === "latest" ? "default" : "outline"}
                    onClick={() => patch("sort", "latest")}
                >
                    <Clock />
                    最新
                </Button>
            </div>

            {tags.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        className={cn(
                            "rounded-md px-2 py-0.5 text-xs",
                            tag === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                        onClick={() => patch("tag", null)}
                    >
                        全部
                    </button>
                    {tags.map((t) => (
                        <button
                            key={t}
                            type="button"
                            className={cn(
                                "rounded-md px-2 py-0.5 text-xs",
                                tag === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                            )}
                            onClick={() => patch("tag", tag === t ? null : t)}
                        >
                            #{t}
                        </button>
                    ))}
                </div>
            )}

            <PostFeed key={`${sort}:${tag ?? ""}`} sort={sort} tag={tag} />
        </Page>
    );
}
