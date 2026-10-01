import { useHostUI, type SlotProps } from "@/plugins/api";
import { TitleBar } from "./_shared";

/**
 * 抽屉顶部的终端面板标题栏，注入为 popup 的第一个 flex item。
 *
 * 宿主的 sheet-content 是 flex-col gap-4，且 SheetFooter 依赖 mt-auto 贴底。
 * 只要不把 children 包进新的盒子，footer 仍然作为直接 flex 子项，mt-auto 照常生效。
 */
export default function SheetContent(props: SlotProps<"sheetContent">) {
    const Host = useHostUI("sheetContent");
    if (!Host) return null;

    const { children, ...rest } = props;
    return (
        <Host {...rest}>
            <TitleBar label="panel" />
            {children}
        </Host>
    );
}
