import { useHostUI, type SlotProps } from "@/plugins/api";
import { Mark } from "./_shared";

/**
 * 菜单项前缀光标「▸ 」；破坏性菜单项换成 !!，配合 CSS 的反色。
 * 宿主是 flex gap-1.5，间距由 gap 提供，这里不再补空格。
 *
 * 只解构 children —— variant 必须留在 rest 里，宿主靠它下发 data-variant。
 */
export default function DropdownMenuItem(props: SlotProps<"dropdownMenuItem">) {
    const Host = useHostUI("dropdownMenuItem");
    if (!Host) return null;

    const { children, ...rest } = props;
    const warn = props.variant === "destructive";
    return (
        <Host {...rest}>
            <Mark className={warn ? "term-mark is-warn" : undefined}>{warn ? "!!" : "▸"}</Mark>
            {children}
        </Host>
    );
}
