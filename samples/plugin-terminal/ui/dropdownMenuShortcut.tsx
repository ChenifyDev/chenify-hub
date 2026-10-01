import { useHostUI, type SlotProps } from "@/plugins/api";
import { Tag } from "./_shared";

/**
 * 快捷键提示渲染成 [F5]。
 * shortcut 有 ml-auto 靠右排布，用 Tag 合成单一子项，ml-auto 仍然生效。
 */
export default function DropdownMenuShortcut(props: SlotProps<"dropdownMenuShortcut">) {
    const Host = useHostUI("dropdownMenuShortcut");
    if (!Host) return null;

    const { children, ...rest } = props;
    return (
        <Host {...rest}>
            <Tag>[{children}]</Tag>
        </Host>
    );
}
