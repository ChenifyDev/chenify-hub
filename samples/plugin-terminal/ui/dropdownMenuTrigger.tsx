import { useHostUI, type SlotProps } from "@/plugins/api";

/** 触发器内容由调用方决定，不注入结构；悬停与展开态走 CSS。 */
export default function DropdownMenuTrigger(props: SlotProps<"dropdownMenuTrigger">) {
    const Host = useHostUI("dropdownMenuTrigger");
    if (!Host) return null;
    return <Host {...props} />;
}
