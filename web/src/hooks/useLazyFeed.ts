import { useEffect } from "react";

import type { TabData } from "@/types/tab.ts";

export function useLazyFeed<T>(tab: TabData<T>): TabData<T> {
    useEffect(() => {
        if (!tab.initialized) void tab.load(true);
    }, [tab.load, tab.initialized]);
    return tab;
}
