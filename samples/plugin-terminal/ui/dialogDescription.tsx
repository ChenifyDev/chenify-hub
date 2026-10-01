import { useHostUI, type SlotProps } from "@/plugins/api";

/** 描述文本走 --muted-foreground，无需结构改造。 */
export default function DialogDescription(props: SlotProps<"dialogDescription">) {
    const Host = useHostUI("dialogDescription");
    if (!Host) return null;
    return <Host {...props} />;
}
