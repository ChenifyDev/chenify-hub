import { useHostUI, type SlotProps } from "@/plugins/api";

/** 关闭按钮自带 render={<Button/>} 与绝对定位，只透传。 */
export default function SheetClose(props: SlotProps<"sheetClose">) {
    const Host = useHostUI("sheetClose");
    if (!Host) return null;
    return <Host {...props} />;
}
