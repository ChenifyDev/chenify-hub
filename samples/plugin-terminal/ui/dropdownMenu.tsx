import { useHostUI, type SlotProps } from "@/plugins/api";

/**
 * Menu.Root 是纯上下文组件，不产生 DOM 节点。
 * 下拉菜单的终端外观全部来自 dropdown-menu-content 及其子项。
 */
export default function DropdownMenu(props: SlotProps<"dropdownMenu">) {
    const Host = useHostUI("dropdownMenu");
    if (!Host) return null;
    return <Host {...props} />;
}
