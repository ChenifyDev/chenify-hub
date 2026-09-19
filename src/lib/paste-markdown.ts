import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

function looksLikeMarkdown(text: string): boolean {
    const lines = text.split("\n");

    for (const line of lines) {
        if (/^#{1,6}\s/.test(line)) return true;
        if (/^>\s/.test(line)) return true;
        if (/^[-*+]\s/.test(line)) return true;
        if (/^\d+\.\s/.test(line)) return true;
        if (/^```/.test(line)) return true;
    }

    if (/\*\*[^*]+\*\*/.test(text)) return true;
    if (/(?<!\*)\*(?!\*)[^*]+\*(?!\*)/.test(text)) return true;
    if (/~~[^~]+~~/.test(text)) return true;
    if (/\[.+\]\(.+\)/.test(text)) return true;
    if (/!\[.*\]\(.+\)/.test(text)) return true;
    if (/\$[^$]+\$/.test(text)) return true;

    return false;
}

export const PasteMarkdown = Extension.create({
    name: "pasteMarkdown",

    addProseMirrorPlugins() {
        const { editor } = this;
        return [
            new Plugin({
                key: new PluginKey("pasteMarkdown"),
                props: {
                    handlePaste(view, event) {
                        const text = event.clipboardData?.getData("text/plain");
                        const html = event.clipboardData?.getData("text/html");

                        if (!text) {
                            return false;
                        }

                        if (html && !looksLikeMarkdown(text)) {
                            return false;
                        }

                        if (!looksLikeMarkdown(text)) {
                            return false;
                        }

                        const json = editor.markdown.parse(text);
                        editor.commands.insertContent(json);
                        return true;
                    },
                },
            }),
        ];
    },
});
