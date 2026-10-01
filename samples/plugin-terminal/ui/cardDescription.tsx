import { useHostUI, type SlotProps } from "@/plugins/api";

/** 透传；副标题的弱化色调走 CSS 的 --muted-foreground。 */
export default function CardDescription(props: SlotProps<"cardDescription">) {
    const Host = useHostUI("cardDescription");
    if (!Host) return null;
    return <Host {...props} />;
}
