import { Mark, Node, mergeAttributes, type JSONContent } from "@tiptap/core";

import type { DocHeading } from "@/lib/tiptap-extensions.ts";

type Token = { type: string; raw: string; [key: string]: unknown };

const DEF_LINE = /^[ \t]*:[ \t]+(.+)$/;

const hidden = (value: unknown) => ({ default: value, renderHTML: () => ({}) });

const token = (name: string, level: "block" | "inline", open: string, re: RegExp, ...fields: string[]) => ({
    name,
    level,
    start: (src: string) =>
        level === "block" ? (re.test(src) ? 0 : -1) : src.toUpperCase().indexOf(open.toUpperCase()),
    tokenize: (src: string): Token | undefined => {
        const m = src.match(re);
        if (!m) return undefined;
        return Object.assign({ type: name, raw: m[0] }, ...fields.map((f, i) => ({ [f]: m[i + 1] })));
    },
});

export const textOf = (node: JSONContent): string =>
    node.type === "text"
        ? (node.text ?? "")
        : (node.content ?? []).map((c) => (c.type === "hardBreak" ? "\n" : textOf(c))).join("");

const inlineOf = (text: string): JSONContent[] =>
    text
        .split("\n")
        .flatMap((line, i) =>
            i ? [{ type: "hardBreak" }, { type: "text", text: line }] : [{ type: "text", text: line }],
        );

export const FootnoteRef = Node.create({
    name: "footnoteRef",
    group: "inline",
    inline: true,
    atom: true,
    addAttributes: () => ({ label: hidden(""), index: hidden(0) }),
    parseHTML: () => [{ tag: 'sup[data-type="footnote-ref"]' }],
    renderHTML: ({ node, HTMLAttributes }) => [
        "sup",
        mergeAttributes(HTMLAttributes, { "data-type": "footnote-ref", id: `fnref-${node.attrs.label}` }),
        ["a", { href: `#fn-${node.attrs.index}` }, `[${(node.attrs.index as number) || "?"}]`],
    ],
    parseMarkdown: (t) => ({ type: "footnoteRef", attrs: { label: String(t.label), index: 0 } }),
    renderMarkdown: (node) => `[^${node.attrs?.label ?? ""}]`,
    markdownTokenizer: token("footnoteRef", "inline", "[^", /^\[\^([^\]\s]+)\]/, "label"),
});

export const FootnoteItem = Node.create({
    name: "footnoteItem",
    group: "block",
    content: "inline*",
    defining: true,
    addAttributes: () => ({ label: hidden(""), index: hidden(0) }),
    parseHTML: () => [{ tag: 'li[data-type="footnote-item"]' }],
    renderHTML: ({ node, HTMLAttributes }) => [
        "li",
        mergeAttributes(HTMLAttributes, { "data-type": "footnote-item", id: `fn-${node.attrs.index}` }),
        ["span", 0],
        ["a", { class: "footnote-back", href: `#fnref-${node.attrs.label}` }, "↩"],
    ],
    parseMarkdown: (t, h) => ({
        type: "footnoteItem",
        attrs: { label: String(t.label), index: 0 },
        content: h.parseInline(h.tokenizeInline?.(String(t.text ?? "")) ?? []),
    }),
    renderMarkdown: (node, h) => `[^${node.attrs?.label ?? ""}]: ${h.renderChildren(node.content ?? [])}`,
    markdownTokenizer: token("footnoteItem", "block", "[^", /^[ \t]*\[\^([^\]\s]+)\]:[ \t]*([^\n]*)/, "label", "text"),
});

export const FootnoteList = Node.create({
    name: "footnoteList",
    group: "block",
    content: "footnoteItem+",
    parseHTML: () => [{ tag: 'ol[data-type="footnote-list"]' }],
    renderHTML: ({ HTMLAttributes }) => ["ol", mergeAttributes(HTMLAttributes, { "data-type": "footnote-list" }), 0],
    renderMarkdown: (node, h) => h.renderChildren(node.content ?? [], "\n\n"),
});

export const Abbr = Mark.create({
    name: "abbr",
    addAttributes() {
        return {
            title: {
                default: null,
                parseHTML: (el) => el.getAttribute("title"),
                renderHTML: (attrs) => (attrs.title ? { title: attrs.title } : {}),
            },
        };
    },
    parseHTML: () => [{ tag: "abbr" }],
    renderHTML: ({ HTMLAttributes }) => ["abbr", HTMLAttributes, 0],
    renderMarkdown: (content, h) => h.renderChildren(content),
});

export const AbbrDef = Node.create({
    name: "abbrDef",
    group: "block",
    atom: true,
    addAttributes: () => ({ term: hidden(""), title: hidden("") }),
    parseHTML: () => [{ tag: 'div[data-type="abbr-def"]' }],
    renderHTML: ({ node, HTMLAttributes }) => [
        "div",
        mergeAttributes(HTMLAttributes, { "data-type": "abbr-def", hidden: "" }),
        `${node.attrs.term}: ${node.attrs.title}`,
    ],
    parseMarkdown: (t) => ({ type: "abbrDef", attrs: { term: String(t.term), title: String(t.title) } }),
    renderMarkdown: (node) => `*[${node.attrs?.term ?? ""}]: ${node.attrs?.title ?? ""}`,
    markdownTokenizer: token("abbrDef", "block", "*[", /^\*\[([^\]\s]+)\]:[ \t]*([^\n]*)/, "term", "title"),
});

export const DefinitionTerm = Node.create({
    name: "definitionTerm",
    content: "inline*",
    parseHTML: () => [{ tag: "dt" }],
    renderHTML: ({ HTMLAttributes }) => ["dt", HTMLAttributes, 0],
});

export const DefinitionDesc = Node.create({
    name: "definitionDesc",
    content: "inline*",
    parseHTML: () => [{ tag: "dd" }],
    renderHTML: ({ HTMLAttributes }) => ["dd", HTMLAttributes, 0],
});

export const DefinitionItem = Node.create({
    name: "definitionItem",
    group: "block",
    content: "definitionTerm definitionDesc+",
    defining: true,
    parseHTML: () => [{ tag: 'div[data-type="definition-item"]' }],
    renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-type": "definition-item" }), 0],
    renderMarkdown: (node, h) => {
        const kids = node.content ?? [];
        const term = kids[0] ? h.renderChildren(kids[0]) : "";
        return `${term}\n${kids
            .slice(1)
            .map((d) => `: ${h.renderChildren(d)}`)
            .join("\n")}`;
    },
});

export const DefinitionList = Node.create({
    name: "definitionList",
    group: "block",
    content: "definitionItem+",
    parseHTML: () => [{ tag: "dl" }],
    renderHTML: ({ HTMLAttributes }) => ["dl", mergeAttributes(HTMLAttributes, { "data-type": "definition-list" }), 0],
    renderMarkdown: (node, h) => h.renderChildren(node.content ?? [], "\n\n"),
});

export const Toc = Node.create({
    name: "toc",
    group: "block",
    atom: true,
    addAttributes() {
        return {
            items: {
                default: [] as DocHeading[],
                parseHTML: (el) => JSON.parse(el.getAttribute("data-items") ?? "[]") as DocHeading[],
                renderHTML: (attrs) => ({ "data-items": JSON.stringify(attrs.items) }),
            },
        };
    },
    parseHTML: () => [{ tag: 'nav[data-type="toc"]' }],
    renderHTML: ({ node, HTMLAttributes }) => [
        "nav",
        mergeAttributes(HTMLAttributes, { "data-type": "toc" }),
        [
            "ol",
            ...(node.attrs.items as DocHeading[]).map((h) => [
                "li",
                { class: `toc-depth-${h.depth}` },
                ["a", { href: `#${h.id}` }, h.text],
            ]),
        ],
    ],
    parseMarkdown: () => ({ type: "toc", attrs: { items: [] } }),
    renderMarkdown: () => "[TOC]",
    markdownTokenizer: token("toc", "block", "[toc]", /^\[TOC\][ \t]*(?:\n|$)/i),
});

export const Mermaid = Node.create({
    name: "mermaid",
    group: "block",
    atom: true,
    addAttributes: () => ({ code: { default: "" } }),
    parseHTML: () => [{ tag: 'div[data-type="mermaid"]' }],
    renderHTML: ({ node, HTMLAttributes }) => [
        "div",
        mergeAttributes(HTMLAttributes, { "data-type": "mermaid" }),
        ["pre", String(node.attrs.code)],
    ],
    addNodeView:
        () =>
        ({ node }) => {
            const code = String(node.attrs.code ?? "");
            const diagram = document.createElement("div");
            const source = document.createElement("pre");
            source.textContent = code;
            const details = document.createElement("details");
            details.append(Object.assign(document.createElement("summary"), { textContent: "Mermaid 源码" }), source);
            const dom = document.createElement("div");
            dom.className = "mermaid-block";
            dom.setAttribute("data-type", "mermaid");
            dom.append(diagram, details);

            let alive = true;
            void import("mermaid")
                .then(async (module) => {
                    const mermaid = module.default;
                    mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
                    const { svg } = await mermaid.render(`mermaid-${crypto.randomUUID()}`, code);
                    if (alive) diagram.innerHTML = svg;
                })
                .catch(() => {
                    if (alive) diagram.textContent = "Mermaid 渲染失败";
                });

            return { dom, destroy: () => (alive = false) };
        },
    parseMarkdown: (t) => ({ type: "mermaid", attrs: { code: String(t.code).trim() } }),
    renderMarkdown: (node) => `\`\`\`mermaid\n${node.attrs?.code ?? ""}\n\`\`\``,
    markdownTokenizer: token("mermaid", "block", "```mermaid", /^```mermaid[ \t]*\r?\n([\s\S]*?)```/, "code"),
});

export const extendedNodes = [
    FootnoteRef,
    FootnoteItem,
    FootnoteList,
    Abbr,
    AbbrDef,
    DefinitionTerm,
    DefinitionDesc,
    DefinitionItem,
    DefinitionList,
    Toc,
    Mermaid,
];

const abbrRegex = (terms: Map<string, string>) =>
    new RegExp(
        `(${[...terms.keys()]
            .sort((a, b) => b.length - a.length)
            .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("|")})`,
    );

function markAbbr(node: JSONContent, terms: Map<string, string>): JSONContent[] {
    const marks = (node.marks ?? []) as { type: string }[];
    if (node.type !== "text" || !node.text || !terms.size || marks.some((m) => m.type === "abbr" || m.type === "code"))
        return [node];
    return node.text.split(abbrRegex(terms)).reduce<JSONContent[]>((parts, part) => {
        if (!part) return parts;
        const title = terms.get(part);
        return parts.concat(
            title
                ? { type: "text", text: part, marks: [...marks, { type: "abbr", attrs: { title } }] }
                : { ...node, text: part },
        );
    }, []);
}

function walkText(node: JSONContent, terms: Map<string, string>): JSONContent[] {
    if (node.type === "text") return markAbbr(node, terms);
    if (!node.content || node.type === "abbrDef" || node.type === "codeBlock") return [node];
    return [{ ...node, content: node.content.flatMap((child) => walkText(child, terms)) }];
}

const patch = (node: JSONContent, fn: (n: JSONContent) => JSONContent): JSONContent => {
    const next = fn(node);
    return next.content ? { ...next, content: next.content.map((child) => patch(child, fn)) } : next;
};

function foldDefinitions(blocks: JSONContent[]): JSONContent[] {
    return blocks.flatMap((block) => {
        const lines = block.type === "paragraph" ? textOf(block).split("\n") : [];
        if (lines.length < 2 || !lines.slice(1).every((line) => DEF_LINE.test(line))) return [block];
        const item = (type: string, text: string) => ({ type, content: inlineOf(text) });
        return [
            {
                type: "definitionList",
                content: [
                    {
                        type: "definitionItem",
                        content: [
                            item("definitionTerm", lines[0]),
                            ...lines.slice(1).map((l) => item("definitionDesc", l.replace(DEF_LINE, "$1"))),
                        ],
                    },
                ],
            },
        ];
    });
}

export function normalizeExtended(doc: JSONContent, headings: DocHeading[]): JSONContent {
    const blocks = doc.content ?? [];
    const terms = new Map(
        blocks.filter((b) => b.type === "abbrDef").map((b) => [String(b.attrs?.term), String(b.attrs?.title)]),
    );
    const items = blocks.filter((block) => block.type === "footnoteItem");
    const order = new Map(items.map((item, i) => [String(item.attrs?.label), i + 1]));

    const index = (node: JSONContent): JSONContent =>
        node.type === "footnoteRef" || node.type === "footnoteItem"
            ? { ...node, attrs: { ...node.attrs, index: order.get(String(node.attrs?.label)) ?? 0 } }
            : node;
    const toc = (node: JSONContent): JSONContent =>
        node.type === "toc" ? { ...node, attrs: { ...node.attrs, items: headings } } : node;

    const body = foldDefinitions(
        blocks.filter((b) => b.type !== "footnoteItem").flatMap((b) => walkText(b, terms).map((n) => patch(n, index))),
    );
    if (items.length > 0) {
        body.push({
            type: "footnoteList",
            content: items.flatMap((item) => walkText(item, terms).map((n) => patch(n, index))),
        });
    }

    return { ...doc, content: body.map((block) => patch(block, toc)) };
}
