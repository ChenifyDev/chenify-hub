import { useHostUI, type SlotProps } from "@/plugins/api";

/** 卡片右侧动作区靠 grid 定位，注入节点会打乱列位，这里只透传。 */
export default function CardAction(props: SlotProps<"cardAction">) {
    const Host = useHostUI("cardAction");
    if (!Host) return null;
    return <Host {...props} />;
}
