import { useHostUI, type SlotProps } from "@/plugins/api";
import { Mark } from "./_shared";

/**
 * 文本型按钮加终端光标前缀 ▸；破坏性按钮换成 !!，配合 CSS 的反色（白底黑字）
 * 在没有色相的单色界面里标出危险操作。
 *
 * 纯图标按钮（children 是 SVG 之类的元素）不加前缀，避免出现「▸ 🔍」这种双重符号。
 *
 * 注意只解构 children —— variant 必须留在 rest 里透传，否则宿主会退回默认变体，
 * 破坏性样式和 bg-destructive 之类的类名会全部丢失。
 */
export default function Button(props: SlotProps<"button">) {
    const Host = useHostUI("button");
    if (!Host) return null;

    const { children, ...rest } = props;
    const isText = typeof children === "string" || typeof children === "number";
    const warn = props.variant === "destructive";

    if (!isText) return <Host {...rest}>{children}</Host>;
    return (
        <Host {...rest}>
            <Mark className={warn ? "term-mark is-warn" : undefined}>{warn ? "!!" : "▸"}</Mark>
            {children}
        </Host>
    );
}
