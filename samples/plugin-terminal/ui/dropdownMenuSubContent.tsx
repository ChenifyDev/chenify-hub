import { useHostUI, type SlotProps } from "@/plugins/api";

/** 二级菜单面板与主面板共用排布，透传即可。 */
export default function DropdownMenuSubContent(props: SlotProps<"dropdownMenuSubContent">) {
    const Host = useHostUI("dropdownMenuSubContent");
    if (!Host) return null;
    return <Host {...props} />;
}
