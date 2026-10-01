import { useHostUI, type SlotProps } from "@/plugins/api";
import { Mark } from "./_shared";

/** 菜单分组标题前缀「# 」，等同于 shell 注释行。 */
export default function DropdownMenuLabel(props: SlotProps<"dropdownMenuLabel">) {
    const Host = useHostUI("dropdownMenuLabel");
    if (!Host) return null;

    const { children, ...rest } = props;
    return (
        <Host {...rest}>
            <Mark>{"# "}</Mark>
            {children}
        </Host>
    );
}
