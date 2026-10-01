import { useHostUI, type SlotProps } from "@/plugins/api";

/**
 * 骨架屏没有子节点可以注入（塞文本会溢出固定高度的占位块），
 * 终端效果改成扫描线动画，由 [data-slot="skeleton"] 的 CSS 实现。
 */
export default function Skeleton(props: SlotProps<"skeleton">) {
    const Host = useHostUI("skeleton");
    if (!Host) return null;
    return <Host {...props} />;
}
