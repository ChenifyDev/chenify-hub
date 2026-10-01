import { useHostUI, type SlotProps } from "@/plugins/api";

/** 菜单 Portal 只决定挂载位置，注入节点会改动菜单渲染树，透传即可。 */
export default function DropdownMenuPortal(props: SlotProps<"dropdownMenuPortal">) {
    const Host = useHostUI("dropdownMenuPortal");
    if (!Host) return null;
    return <Host {...props} />;
}
