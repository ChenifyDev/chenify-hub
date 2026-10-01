import { nodePasteRule } from "@tiptap/core";
import Image from "@tiptap/extension-image";

export const HighPriorityImage = Image.extend({
    priority: 1100,

    addPasteRules() {
        return [
            nodePasteRule({
                find: /(?:^|\s)(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))/g,
                type: this.type,
                getAttributes: (match) => {
                    const [, , alt, src, title] = match;
                    return { src, alt, title };
                },
            }),
        ];
    },
});
