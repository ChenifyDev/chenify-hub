import type { AppNotification, Paginated } from "./types";
import { qs, request } from "./http";

export function listNotifications(offset = 0, limit = 20): Promise<Paginated<AppNotification>> {
    return request<Paginated<AppNotification>>(`/notifications${qs({ offset, limit })}`);
}

export function getUnreadNotifications(): Promise<{ count: number }> {
    return request<{ count: number }>("/notifications/unread-count");
}

export function markNotificationsRead(ids?: number[]): Promise<{ success: boolean }> {
    return request<{ success: boolean }>("/notifications/read", {
        method: "POST",
        body: JSON.stringify(ids ? { ids } : {}),
    });
}
