import { useHostUI, type SlotProps } from "@/plugins/api";

/** SubmenuRoot 是纯上下文组件，不产生 DOM 节点，只能透传。 */
export default function DropdownMenuSub(props: SlotProps<"dropdownMenuSub">) {
    const Host = useHostUI("dropdownMenuSub");
    if (!Host) return null;
    return <Host {...props} />;
}
