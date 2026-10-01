import { useHostUI, type SlotProps } from "@/plugins/api";
import { Mark } from "./_shared";

/** 抽屉标题前缀「▌ 」。 */
export default function SheetTitle(props: SlotProps<"sheetTitle">) {
    const Host = useHostUI("sheetTitle");
    if (!Host) return null;

    const { children, ...rest } = props;
    return (
        <Host {...rest}>
            <Mark>{"▌ "}</Mark>
            {children}
        </Host>
    );
}
