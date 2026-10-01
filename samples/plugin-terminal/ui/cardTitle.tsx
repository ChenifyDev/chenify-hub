import { useHostUI, type SlotProps } from "@/plugins/api";
import { Mark } from "./_shared";

/** 卡片标题前缀「▌ 」，模拟终端里的高亮块。 */
export default function CardTitle(props: SlotProps<"cardTitle">) {
    const Host = useHostUI("cardTitle");
    if (!Host) return null;

    const { children, ...rest } = props;
    return (
        <Host {...rest}>
            <Mark>{"▌ "}</Mark>
            {children}
        </Host>
    );
}
