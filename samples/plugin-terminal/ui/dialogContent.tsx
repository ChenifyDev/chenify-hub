import { useHostUI, type SlotProps } from "@/plugins/api";
import { TitleBar } from "./_shared";

/**
 * 终端窗口标题栏，注入为 popup 的第一个 grid item。
 *
 * 宿主的 dialog-content 是 grid gap-4：标题栏作为兄弟节点插入后，
 * 下面的 children 依旧是直接子项，gap 与顺序都不会变。
 * 标题栏右侧留白由 CSS 给出，避免与宿主自己渲染的绝对定位关闭按钮重叠。
 */
export default function DialogContent(props: SlotProps<"dialogContent">) {
    const Host = useHostUI("dialogContent");
    if (!Host) return null;

    const { children, ...rest } = props;
    return (
        <Host {...rest}>
            <TitleBar label="window" />
            {children}
        </Host>
    );
}
