import { useHostUI, type SlotProps } from "@/plugins/api";
import { cn } from "@/lib/utils";

/**
 * 终端提示符 `$` + 输入框。
 *
 * <input> 是 replaced element，渲染不了伪元素，所以提示符只能放到外层。
 * 边框与内边距由 CSS 从 input 移到 wrapper（.term-input），聚焦态用 :focus-within 接管，
 * 同时关掉宿主写在 input 上的 focus-visible ring。
 *
 * 这是全插件唯一真正用盒子包裹 children 的地方（R1-3）：input 的父级是表单行，
 * 没有 gap / mt-auto 之类的布局语义，包裹不会破坏任何宿主布局。
 */
export default function Input(props: SlotProps<"input">) {
    const Host = useHostUI("input");
    if (!Host) return null;

    const { className, ...rest } = props;
    return (
        <span className="term-input">
            <span className="term-input-prompt" aria-hidden="true">
                $
            </span>
            <Host {...rest} className={cn("term-input-field", className)} />
        </span>
    );
}
