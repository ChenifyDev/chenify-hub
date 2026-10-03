import type { UserPublic } from "@/lib/api";
import { create } from "zustand";

import { getToken } from "@/lib/api/token.ts";

interface UserState {
    user: UserPublic | null;
    checking: boolean;
    setUser: (user: UserPublic | null) => void;
    setChecking: (checking: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    checking: getToken() !== null,
    setUser: (user: UserPublic | null) => set({ user }),
    setChecking: (checking: boolean) => set({ checking }),
}));
