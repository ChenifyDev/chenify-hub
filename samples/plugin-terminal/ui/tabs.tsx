import { useHostUI, type SlotProps } from "@/plugins/api";

/** Tabs 根节点带 data-orientation 供 CSS 决定纵向/横向，透传即可。 */
export default function Tabs(props: SlotProps<"tabs">) {
    const Host = useHostUI("tabs");
    if (!Host) return null;
    return <Host {...props} />;
}
