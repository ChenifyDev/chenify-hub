import { useCallback, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { NotificationRow } from "@/components/notifications/NotificationRow.tsx";
import { notificationLink } from "@/components/notifications/notificationLink.ts";
import FeedList from "@/components/forum/FeedList.tsx";
import { Page, PageHeader } from "@/components/layout/Page.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useInfiniteList } from "@/hooks/useInfiniteList.ts";
import { listNotifications, markNotificationsRead, type AppNotification } from "@/lib/api";
import { useUnreadStore } from "@/stores/useUnread.ts";

const LIMIT = 20;

export default function NotificationsPage() {
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

    return (
        <Page className="max-w-none">
            <PageHeader
                icon={Bell}
                title="消息中心"
                action={
                    unread > 0 && (
                        <Button size="sm" variant="outline" onClick={() => void handleMarkAll()}>
                            <CheckCheck />
                            全部已读 ({unread})
                        </Button>
                    )
                }
            />

            <FeedList feed={feed} empty="暂无消息">
                {(notification) => (
                    <NotificationRow
                        key={notification.id}
                        notification={notification}
                        link={notificationLink(notification)}
                        onOpen={handleOpen}
                    />
                )}
            </FeedList>
        </Page>
    );
}
