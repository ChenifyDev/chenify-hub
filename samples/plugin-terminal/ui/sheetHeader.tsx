import { useHostUI, type SlotProps } from "@/plugins/api";

/** 标题与描述的堆叠容器，标题的「▌ 」由 sheetTitle 负责，这里透传。 */
export default function SheetHeader(props: SlotProps<"sheetHeader">) {
    const Host = useHostUI("sheetHeader");
    if (!Host) return null;
    return <Host {...props} />;
}
