import { useHostUI, type SlotProps } from "@/plugins/api";

/**
 * 头部是标题与描述的堆叠容器，标题的「▌ 」由 dialogTitle 负责，
 * 这里注入反而会多出一层盒子，透传即可。
 */
export default function DialogHeader(props: SlotProps<"dialogHeader">) {
    const Host = useHostUI("dialogHeader");
    if (!Host) return null;
    return <Host {...props} />;
}
