import { useEffect, useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";

import { parseFrontmatter } from "@/lib/frontmatter.ts";
import { parseDocument, sharedExtensions } from "@/lib/tiptap-extensions.ts";
import { cn } from "@/lib/utils.ts";

export function Markdown({ content, className }: { content: string; className?: string }) {
    const { title, body } = useMemo(() => parseFrontmatter(content), [content]);
    const { doc } = useMemo(() => parseDocument(body), [body]);

    const editor = useEditor({
        extensions: sharedExtensions,
        content: doc,
        editable: false,
        injectCSS: false,
        editorProps: { attributes: { class: "markdown-body" } },
    });

    useEffect(() => {
        if (editor && doc) {
            editor.commands.setContent(doc);
        }
    }, [doc, editor]);

    return (
        <div className={cn("markdown-body", className)}>
            {title && <h1>{title}</h1>}
            <EditorContent editor={editor} />
        </div>
    );
}

export default Markdown;
