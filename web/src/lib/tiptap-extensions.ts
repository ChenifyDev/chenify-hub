import { Extension, type JSONContent } from "@tiptap/core";
import { Markdown, MarkdownManager } from "@tiptap/markdown";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { lowlight } from "lowlight";

import { HighPriorityImage } from "@/lib/high-priority-image.ts";
import { extendedNodes, normalizeExtended, textOf } from "@/lib/tiptap-md-extended.ts";
import { MathExtensions } from "@/lib/tiptap-math.ts";

export type DocHeading = { id: string; text: string; depth: number };

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/[\s-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

const HeadingAnchor = Extension.create({
    name: "headingAnchor",
    addGlobalAttributes() {
        return [
            {
                types: ["heading"],
                attributes: {
                    id: {
                        default: null,
                        parseHTML: (element) => element.id || null,
                        renderHTML: (attributes) => (attributes.id ? { id: attributes.id } : {}),
                    },
                },
            },
        ];
    },
});

export const sharedExtensions = [
    ...MathExtensions,
    ...extendedNodes,
    HighPriorityImage.configure({ inline: true, allowBase64: true }),
    StarterKit.configure({ codeBlock: false, link: { openOnClick: false } }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: false }),
    CodeBlockLowlight.configure({ lowlight, defaultLanguage: "auto" }),
    Placeholder.configure({ placeholder: "在这里写帖子…" }),
    Markdown.configure({ markedOptions: { breaks: true, gfm: true } }),
    HeadingAnchor,
];

const manager = new MarkdownManager({
    markedOptions: { breaks: true, gfm: true },
    extensions: sharedExtensions,
});

export function serialize(doc: JSONContent): string {
    return manager.serialize(doc).trimEnd();
}

function typography(text: string): string {
    return text
        .replace(/\.\.\./g, "…")
        .replace(/(^|[^-])--(?!-)/g, "$1—")
        .replace(/(^|[\s([{])"/g, "$1“")
        .replace(/"/g, "”")
        .replace(/(^|[^\w])'(?=\w)/g, "$1‘")
        .replace(/'/g, "’");
}

export function parseDocument(content: string): { doc: JSONContent; headings: DocHeading[] } {
    const doc = manager.parse(content);
    const headings: DocHeading[] = [];
    const taken = new Set<string>();

    const uniqueId = (base: string) => {
        let id = base;
        for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
        taken.add(id);
        return id;
    };

    const rawNode = (node: JSONContent) => node.type === "code" || node.type === "codeBlock";

    const walk = (node: JSONContent, raw: boolean) => {
        if (node.type === "text" && !raw) node.text = typography(node.text ?? "");
        if (node.type === "heading") {
            const text = textOf(node).trim();
            const id = uniqueId(slugify(text));
            node.attrs = { ...node.attrs, id };
            if (text) headings.push({ id, text, depth: (node.attrs?.level as number | undefined) ?? 1 });
        }
        for (const child of node.content ?? []) walk(child, raw || rawNode(node));
    };
    walk(doc, false);

    return { doc: normalizeExtended(doc, headings), headings };
}
