import { useHostUI, type SlotProps } from "@/plugins/api";
import { Mark } from "./_shared";

/**
 * 二级菜单入口前缀光标「▸ 」。
 * 宿主自己解构 children 并在末尾补 ChevronRightIcon，注入的标记会排在最前，
 * 得到「▸ 设置 ›」的顺序。
 */
export default function DropdownMenuSubTrigger(props: SlotProps<"dropdownMenuSubTrigger">) {
    const Host = useHostUI("dropdownMenuSubTrigger");
    if (!Host) return null;

    const { children, ...rest } = props;
    return (
        <Host {...rest}>
            <Mark>▸</Mark>
            {children}
        </Host>
    );
}
