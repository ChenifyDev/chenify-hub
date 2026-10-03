import { create } from "zustand";

import { getUnreadNotifications } from "@/lib/api";

type UnreadState = {
    count: number;
    refresh: () => Promise<void>;
    set: (count: number) => void;
    decrement: () => void;
};

export const useUnreadStore = create<UnreadState>((set) => ({
    count: 0,
    refresh: async () => {
        try {
            const { count } = await getUnreadNotifications();
            set({ count });
        } catch {}
    },
    set: (count) => set({ count }),
    decrement: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
}));
