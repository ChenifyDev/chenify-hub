import { useHostUI, type SlotProps } from "@/plugins/api";

/**
 * Sheet 的 Root 同样不渲染 DOM 节点，只能透传。
 * 外观由 sheet-content / sheet-title 等下游插槽承担。
 */
export default function Sheet(props: SlotProps<"sheet">) {
    const Host = useHostUI("sheet");
    if (!Host) return null;
    return <Host {...props} />;
}
