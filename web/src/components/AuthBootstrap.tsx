import { useEffect, type ReactNode } from "react";
import { clearToken, getToken, me } from "@/lib/api";
import { ApiError } from "@/lib/api/http";
import { useUserStore } from "@/stores/useUser.ts";
import { useCoinsStore } from "@/stores/useCoins.ts";

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS = [1000, 3000, 5000];

export default function AuthBootstrap({ children }: { children: ReactNode }) {
    const setUser = useUserStore((s) => s.setUser);
    const setChecking = useUserStore((s) => s.setChecking);
    const fetchBalance = useCoinsStore((s) => s.fetchBalance);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            setChecking(false);
            return;
        }

        let cancelled = false;
        let attempt = 0;
        setChecking(true);

        const tryMe = async (): Promise<void> => {
            try {
                const user = await me();
                if (cancelled) return;
                setUser(user);
                void fetchBalance();
                setChecking(false);
                return;
            } catch (err) {
                if (cancelled) return;
                if (err instanceof ApiError && err.status === 401) {
                    clearToken();
                    setChecking(false);
                    return;
                }
                if (attempt < MAX_ATTEMPTS) {
                    const delay = RETRY_DELAYS[attempt] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
                    attempt += 1;
                    setTimeout(() => void tryMe(), delay);
                    return;
                }
                setChecking(false);
            }
        };

        void tryMe();
        return () => {
            cancelled = true;
        };
    }, [setChecking, setUser, fetchBalance]);

    return children;
}
