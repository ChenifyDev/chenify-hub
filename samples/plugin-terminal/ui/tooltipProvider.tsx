import { useHostUI, type SlotProps } from "@/plugins/api";

/** Tooltip.Provider 只提供延迟等上下文，不渲染任何 DOM 节点，只能透传。 */
export default function TooltipProvider(props: SlotProps<"tooltipProvider">) {
    const Host = useHostUI("tooltipProvider");
    if (!Host) return null;
    return <Host {...props} />;
}
