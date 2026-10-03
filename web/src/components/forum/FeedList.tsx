import type { ReactNode } from "react";

import Empty from "@/components/tab/Empty.tsx";
import LoadMore from "@/components/tab/LoadMore.tsx";
import SkeletonList from "@/components/forum/SkeletonList.tsx";

type Feed<T> = {
    items: T[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    hidden: boolean;
    error: string | null;
    load: (reset?: boolean) => Promise<void>;
};

export default function FeedList<T>({
    feed,
    empty = "这里还空空如也",
    hiddenText,
    className = "grid gap-3",
    children,
}: {
    feed: Feed<T>;
    empty?: string;
    hiddenText?: string;
    className?: string;
    children: (item: T) => ReactNode;
}) {
    if (feed.loading) return <SkeletonList />;
    if (feed.error) return <Empty text={feed.error} />;
    if (feed.hidden && hiddenText) return <Empty text={hiddenText} />;
    if (feed.items.length === 0) return <Empty text={empty} />;
    return (
        <div className={className}>
            {feed.items.map(children)}
            <LoadMore feed={feed} />
        </div>
    );
}
