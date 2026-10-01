import { useHostUI, type SlotProps } from "@/plugins/api";

/**
 * sheet-footer 依赖 mt-auto 贴到抽屉底部。注入任何额外子项都可能改变
 * 这条贴底规则的计算，因此只透传，排布交给宿主。
 */
export default function SheetFooter(props: SlotProps<"sheetFooter">) {
    const Host = useHostUI("sheetFooter");
    if (!Host) return null;
    return <Host {...props} />;
}
