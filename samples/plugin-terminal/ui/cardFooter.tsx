import { useHostUI, type SlotProps } from "@/plugins/api";

/** 透传；分隔样式由 [data-slot="card-footer"] 的 CSS 决定。 */
export default function CardFooter(props: SlotProps<"cardFooter">) {
    const Host = useHostUI("cardFooter");
    if (!Host) return null;
    return <Host {...props} />;
}
