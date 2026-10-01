import { useCallback, useEffect, useState } from "react";

const DRAFT_PREFIX = "draft:";

const keys = (scope: string) => ({
    content: `${DRAFT_PREFIX}${scope}:content`,
    title: `${DRAFT_PREFIX}${scope}:title`,
    commentArea: `${DRAFT_PREFIX}${scope}:comment-area`,
    tag: `${DRAFT_PREFIX}${scope}:tag`,
});

export function clearAllDrafts(): void {
    for (const key of Object.keys(localStorage)) {
        if (key.startsWith(DRAFT_PREFIX)) localStorage.removeItem(key);
    }
}

export function useDraftPersistence(id: string | null) {
    const scope = id ?? "new";
    const [content, setContent] = useState(() => localStorage.getItem(keys(scope).content) ?? "");
    const [title, setTitle] = useState(() => localStorage.getItem(keys(scope).title) ?? "");
    const [commentArea, setCommentArea] = useState(() => localStorage.getItem(keys(scope).commentArea) !== "false");
    const [tagInput, setTagInput] = useState(() => localStorage.getItem(keys(scope).tag) ?? "");

    useEffect(() => {
        const timer = setTimeout(() => {
            const current = keys(scope);
            localStorage.setItem(current.content, content);
            localStorage.setItem(current.title, title);
            localStorage.setItem(current.commentArea, commentArea ? "1" : "false");
            localStorage.setItem(current.tag, tagInput);
        }, 800);
        return () => clearTimeout(timer);
    }, [content, title, tagInput, commentArea, scope]);

    const clear = useCallback(() => {
        const current = keys(scope);
        localStorage.removeItem(current.content);
        localStorage.removeItem(current.title);
        localStorage.removeItem(current.commentArea);
        localStorage.removeItem(current.tag);
    }, [scope]);

    return { content, setContent, title, setTitle, commentArea, setCommentArea, tagInput, setTagInput, clear };
}
