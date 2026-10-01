import { useHostUI, type SlotProps } from "@/plugins/api";
import { Mark } from "./_shared";

/** 弹窗标题前缀「▌ 」，与窗口标题栏的样式呼应。 */
export default function DialogTitle(props: SlotProps<"dialogTitle">) {
    const Host = useHostUI("dialogTitle");
    if (!Host) return null;

    const { children, ...rest } = props;
    return (
        <Host {...rest}>
            <Mark>{"▌ "}</Mark>
            {children}
        </Host>
    );
}
