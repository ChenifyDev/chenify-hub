import { useHostUI, type SlotProps } from "@/plugins/api";

/** 分组容器只是语义容器，分组标题的「# 」由 dropdownMenuLabel 负责，这里透传。 */
export default function DropdownMenuGroup(props: SlotProps<"dropdownMenuGroup">) {
    const Host = useHostUI("dropdownMenuGroup");
    if (!Host) return null;
    return <Host {...props} />;
}
