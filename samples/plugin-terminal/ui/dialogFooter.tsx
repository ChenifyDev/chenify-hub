import { useHostUI, type SlotProps } from "@/plugins/api";

/**
 * 宿主的 dialog-footer 是 flex-col-reverse（窄屏）/ flex-row（宽屏），
 * 往里注入任何节点都会在两种布局下落到不同的视觉位置，方向不可控。
 * 按钮排布与反色的破坏性样式全部交给 CSS。
 */
export default function DialogFooter(props: SlotProps<"dialogFooter">) {
    const Host = useHostUI("dialogFooter");
    if (!Host) return null;
    return <Host {...props} />;
}
