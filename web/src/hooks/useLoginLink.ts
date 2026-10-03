import { useLocation } from "react-router-dom";

export function useLoginLink(): string {
    const { pathname, search } = useLocation();
    return `/login?return_to=${encodeURIComponent(`${pathname}${search}`)}`;
}
