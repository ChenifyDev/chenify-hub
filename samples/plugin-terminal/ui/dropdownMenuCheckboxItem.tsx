import { useHostUI, type SlotProps } from "@/plugins/api";
import { Mark } from "./_shared";

/**
 * 勾选菜单项前缀光标「▸ 」，与普通菜单项保持一致。
 * 右侧的勾选框由 CSS 改成终端式的 [x] / [ ] —— 勾选状态在 Base UI 内部，
 * wrapper 拿不到，只能靠 data-checked 走 CSS。
 */
export default function DropdownMenuCheckboxItem(props: SlotProps<"dropdownMenuCheckboxItem">) {
    const Host = useHostUI("dropdownMenuCheckboxItem");
    if (!Host) return null;

    const { children, ...rest } = props;
    return (
        <Host {...rest}>
            <Mark>▸</Mark>
            {children}
        </Host>
    );
}
