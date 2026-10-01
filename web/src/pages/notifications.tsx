import { useCallback, useEffect } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { NotificationRow } from "@/components/notifications/NotificationRow.tsx";
import { notificationLink } from "@/components/notifications/notificationLink.ts";
import SkeletonList from "@/components/forum/SkeletonList.tsx";
import Empty from "@/components/tab/Empty.tsx";
import LoadMore from "@/components/tab/LoadMore.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useInfiniteList } from "@/hooks/useInfiniteList.ts";
import { listNotifications, markNotificationsRead, type AppNotification } from "@/lib/api";
import { useUserStore } from "@/stores/useUser.ts";
import { useUnreadStore } from "@/stores/useUnread.ts";

const LIMIT = 20;

export default function NotificationsPage() {
    const user = useUserStore((s) => s.user);
    const checking = useUserStore((s) => s.checking);
    const unread = useUnreadStore((s) => s.count);
    const navigate = useNavigate();

    const feed = useInfiniteList<AppNotification>({
        fetcher: useCallback(async (offset, limit) => {
            const res = await listNotifications(offset, limit);
            return { items: res.items, hasMore: res.hasMore, hidden: false };
        }, []),
        limit: LIMIT,
    });

    useEffect(() => {
        void useUnreadStore.getState().refresh();
    }, []);

    const handleOpen = async (notification: AppNotification) => {
        if (!notification.is_read) {
            try {
                await markNotificationsRead([notification.id]);
                feed.setItems((items) =>
                    items.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)),
                );
                useUnreadStore.getState().decrement();
            } catch {}
        }
        if (notification.post_id) navigate(`/posts/${notification.post_id}`);
    };

    const handleMarkAll = async () => {
        try {
            await markNotificationsRead();
            feed.setItems((items) => items.map((item) => ({ ...item, is_read: true })));
            useUnreadStore.getState().set(0);
        } catch (err) {
            console.error(err);
        }
    };

    if (checking) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }
    if (!user) return null;
    if (feed.loading) return <SkeletonList />;
    if (feed.error) return <Empty text={feed.error} />;

    return (
        <div className="mx-auto w-full p-4 md:p-6">
            <header className="mb-4 flex items-center justify-between">
                <h1 className="flex items-center gap-2 text-xl font-semibold">
                    <Bell className="size-5" />
                    消息中心
                </h1>
                {unread > 0 && (
                    <Button size="sm" variant="outline" onClick={() => void handleMarkAll()}>
                        <CheckCheck />
                        全部已读 ({unread})
                    </Button>
                )}
            </header>

            {feed.items.length === 0 ? (
                <Empty text="暂无消息" />
            ) : (
                <div className="grid gap-3">
                    {feed.items.map((notification) => (
                        <NotificationRow
                            key={notification.id}
                            notification={notification}
                            link={notificationLink(notification)}
                            onOpen={handleOpen}
                        />
                    ))}
                    {feed.hasMore && <LoadMore loading={feed.loadingMore} onClick={() => void feed.load()} />}
                </div>
            )}
        </div>
    );
}
