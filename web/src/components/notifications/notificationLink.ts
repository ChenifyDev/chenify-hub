import type { AppNotification } from "@/lib/api";
import { parseFrontmatter } from "@/lib/frontmatter.ts";

export function notificationLink(notification: AppNotification): { to: string; text: string } | null {
    if (!notification.post_id) return null;
    const to = `/posts/${notification.post_id}`;
    const snippet = (text: string) => parseFrontmatter(text).body || "查看详情";
    if (notification.type === "post_reply") {
        return { to, text: notification.reply_to ? snippet(notification.reply_to) : snippet(notification.snippet) };
    }
    return { to, text: snippet(notification.snippet) };
}
