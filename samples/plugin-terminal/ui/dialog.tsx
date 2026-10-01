import { useHostUI, type SlotProps } from "@/plugins/api";

/**
 * Dialog.Root 只提供上下文，本身不渲染 DOM 节点，
 * 未知 props 会被整个丢弃（连 data-slot 都进不去）。
 * 终端外观由它的 DOM 型下游插槽（dialog-content / dialog-title …）承担。
 */
export default function Dialog(props: SlotProps<"dialog">) {
    const Host = useHostUI("dialog");
    if (!Host) return null;
    return <Host {...props} />;
}
