import { useHostUI, type SlotProps } from "@/plugins/api";

/** 触发器内容由调用方决定，不注入结构；边框与悬停态走 CSS。 */
export default function SheetTrigger(props: SlotProps<"sheetTrigger">) {
    const Host = useHostUI("sheetTrigger");
    if (!Host) return null;
    return <Host {...props} />;
}
