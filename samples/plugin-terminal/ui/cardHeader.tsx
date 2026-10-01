import { useHostUI, type SlotProps } from "@/plugins/api";

/**
 * 卡片头部是 grid 布局（含 card-title / card-description / card-action 的列位约定），
 * 不能注入节点，标题的「▌ 」由 cardTitle 插槽自己负责。
 */
export default function CardHeader(props: SlotProps<"cardHeader">) {
    const Host = useHostUI("cardHeader");
    if (!Host) return null;
    return <Host {...props} />;
}
