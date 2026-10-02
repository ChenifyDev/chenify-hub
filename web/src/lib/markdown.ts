import type { JSONContent } from "@tiptap/core";

import { parseDocument, serialize } from "@/lib/tiptap-extensions.ts";

export type TruncateMarkdownResult = { excerpt: string; isTruncated: boolean };

function textOf(node: JSONContent): string {
    if (node.type === "text") return node.text ?? "";
    if (node.type === "hardBreak") return "\n";
    const kids = (node.content ?? []).map(textOf);
    if (kids.length === 0) return "";
    const separated = node.type === "bulletList" || node.type === "orderedList" ? "\n" : "";
    return kids.join(separated) + "\n\n";
}

export function truncateMarkdown(content: string, maxLength: number): TruncateMarkdownResult {
    const { doc } = parseDocument(content);
    const blocks = doc.content ?? [];
    const sizes = blocks.map((block) => textOf(block).trimEnd().length);
    if (sizes.reduce((sum, size) => sum + size, 0) <= maxLength) {
        return { excerpt: content, isTruncated: false };
    }

    const kept: JSONContent[] = [];
    let used = 0;
    for (const [i, block] of blocks.entries()) {
        if (kept.length > 0 && used + sizes[i] > maxLength) break;
        used += sizes[i];
        kept.push(block);
    }
    return { excerpt: serialize({ ...doc, content: kept }), isTruncated: true };
}
