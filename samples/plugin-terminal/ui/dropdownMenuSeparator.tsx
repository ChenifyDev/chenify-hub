import { useHostUI, type SlotProps } from "@/plugins/api";

/** 分隔线没有子节点，终端的虚线样式由 [data-slot="dropdown-menu-separator"] 的 CSS 给出。 */
export default function DropdownMenuSeparator(props: SlotProps<"dropdownMenuSeparator">) {
    const Host = useHostUI("dropdownMenuSeparator");
    if (!Host) return null;
    return <Host {...props} />;
}
