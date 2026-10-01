import { useHostUI, type SlotProps } from "@/plugins/api";

/**
 * 分隔线只透传，终端样式交给 CSS。
 *
 * 宿主写的是 data-horizontal / data-vertical，而 Base UI 实际下发的是
 * data-orientation（getStateAttributesProps 按 state 键名生成），
 * 所以本插件的 CSS 统一按 data-orientation 选择 —— 顺带补上了宿主缺失的
 * 高度/宽度，否则这条线是 0 高度的。
 */
export default function Separator(props: SlotProps<"separator">) {
    const Host = useHostUI("separator");
    if (!Host) return null;
    return <Host {...props} />;
}
