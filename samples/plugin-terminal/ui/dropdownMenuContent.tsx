import { useHostUI, type SlotProps } from "@/plugins/api";

/**
 * 菜单面板的子项排布由宿主的 p-1 与各菜单项自己承担。
 * 顶部再插一行会和 dropdownMenuLabel 的「# 」重复，所以只透传。
 */
export default function DropdownMenuContent(props: SlotProps<"dropdownMenuContent">) {
    const Host = useHostUI("dropdownMenuContent");
    if (!Host) return null;
    return <Host {...props} />;
}
