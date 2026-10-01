import { useHostUI, type SlotProps } from "@/plugins/api";

/**
 * 遮罩没有子节点可注入，终端效果（更重的暗角与压暗）交给
 * [data-slot="dialog-overlay"] 的 CSS。
 */
export default function DialogOverlay(props: SlotProps<"dialogOverlay">) {
    const Host = useHostUI("dialogOverlay");
    if (!Host) return null;
    return <Host {...props} />;
}
