import { useHostUI, type SlotProps } from "@/plugins/api";

/** Tooltip.Root 是纯上下文组件，不产生 DOM 节点，只能透传。 */
export default function Tooltip(props: SlotProps<"tooltip">) {
    const Host = useHostUI("tooltip");
    if (!Host) return null;
    return <Host {...props} />;
}
