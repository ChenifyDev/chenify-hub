import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";

export default function LoadMore({
    feed,
}: {
    feed: { hasMore: boolean; loadingMore: boolean; load: (reset?: boolean) => Promise<void> };
}) {
    if (!feed.hasMore) return null;
    return (
        <Button variant="outline" className="w-full" disabled={feed.loadingMore} onClick={() => void feed.load()}>
            {feed.loadingMore && <Loader2 className="animate-spin" />}
            {feed.loadingMore ? "加载中…" : "加载更多"}
        </Button>
    );
}
