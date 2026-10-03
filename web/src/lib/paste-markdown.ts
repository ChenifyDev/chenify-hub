import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

import { parseDocument } from "@/lib/tiptap-extensions.ts";

const LINE_MARKERS = /^(```|#{1,6}\s|[-*+]\s|\d+\.\s|>\s|:\s|\|)/;
const INLINE_MARKERS = [/(\*\*|~~)[^*~]+\1/, /(?<!\*)\*(?!\*)[^*]+\*(?!\*)/, /\[[^\]]+\]\([^)]+\)/, /\$[^$]+\$/];

const looksLikeMarkdown = (text: string) =>
    text.split("\n").some((line) => LINE_MARKERS.test(line)) || INLINE_MARKERS.some((re) => re.test(text));

export const PasteMarkdown = Extension.create({
    name: "pasteMarkdown",

    addProseMirrorPlugins() {
        const { editor } = this;
        return [
            new Plugin({
                key: new PluginKey("pasteMarkdown"),
                props: {
                    handlePaste(_, event) {
                        const text = event.clipboardData?.getData("text/plain") ?? "";
                        if (!text || !looksLikeMarkdown(text)) return false;
                        try {
                            editor.commands.insertContent(parseDocument(text).doc);
                            return true;
                        } catch {
                            return false;
                        }
                    },
                },
            }),
        ];
    },
});
