import { useHostUI, type SlotProps } from "@/plugins/api";

/** 单选组是纯语义容器，透传即可；选中态由子项的 data-checked 呈现。 */
export default function DropdownMenuRadioGroup(props: SlotProps<"dropdownMenuRadioGroup">) {
    const Host = useHostUI("dropdownMenuRadioGroup");
    if (!Host) return null;
    return <Host {...props} />;
}
