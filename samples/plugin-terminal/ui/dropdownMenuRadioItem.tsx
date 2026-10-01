import { useHostUI, type SlotProps } from "@/plugins/api";
import { Mark } from "./_shared";

/** 单选菜单项前缀光标「▸ 」，与其余菜单项保持一致；选中态交给 CSS 的 data-checked。 */
export default function DropdownMenuRadioItem(props: SlotProps<"dropdownMenuRadioItem">) {
    const Host = useHostUI("dropdownMenuRadioItem");
    if (!Host) return null;

    const { children, ...rest } = props;
    return (
        <Host {...rest}>
            <Mark>▸</Mark>
            {children}
        </Host>
    );
}
