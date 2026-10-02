import { useHostUI, type SlotProps } from "@/plugins/api";
import { Tag } from "./_shared";

/**
 * [标签] 形式的徽章。
 *
 * 用 Tag 把括号和内容合成一个子项：badge 是 inline-flex 且 gap-1，
 * 拆成三个兄弟节点会被 gap 撑成「[ 标签 ]」。
 * 破坏性徽章额外加 !! 前缀 —— 单色下没有红色可用来示警。
 *
 * 只解构 children，variant 留在 rest 里透传给宿主的 badgeVariants。
 */
export default function Badge(props: SlotProps<"badge">) {
    const Host = useHostUI("badge");
    if (!Host) return null;

    const { children, ...rest } = props;
    const warn = props.variant === "destructive";
    return (
        <Host {...rest}>
            <Tag>
                {warn ? "!!" : ""}[{children}]
            </Tag>
        </Host>
    );
}
