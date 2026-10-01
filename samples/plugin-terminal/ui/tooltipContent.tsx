import { useHostUI, type SlotProps } from "@/plugins/api";
import { Mark } from "./_shared";

/**
 * 提示气泡加前缀「▸ 」。
 * 宿主显式渲染 {children} 后再补一个 Arrow，注入的标记只会成为 children 的
 * 兄弟节点，箭头照常保留。
 */
export default function TooltipContent(props: SlotProps<"tooltipContent">) {
    const Host = useHostUI("tooltipContent");
    if (!Host) return null;

    const { children, ...rest } = props;
    return (
        <Host {...rest}>
            <Mark>▸</Mark>
            {children}
        </Host>
    );
}
