import { type ReactNode, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useUserStore } from "@/stores/useUser.ts";

export default function RequireAuth({ children }: { children: ReactNode }) {
    const user = useUserStore((state) => state.user);
    const checking = useUserStore((state) => state.checking);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!checking && !user) {
            const back = encodeURIComponent(`${location.pathname}${location.search}`);
            navigate(`/login?return_to=${back}`, { replace: true });
        }
    }, [checking, user, navigate, location.pathname, location.search]);

    if (checking || !user) {
        return (
            <div className="flex min-h-svh items-center justify-center p-4">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }
    return children;
}
