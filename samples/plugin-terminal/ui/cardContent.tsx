import { useHostUI, type SlotProps } from "@/plugins/api";

/** 透传；内容区只做内边距，不需要结构改造。 */
export default function CardContent(props: SlotProps<"cardContent">) {
    const Host = useHostUI("cardContent");
    if (!Host) return null;
    return <Host {...props} />;
}
