import { useHostUI, type SlotProps } from "@/plugins/api";
import { Tag } from "./_shared";

/**
 * [标签] 形式的页签。选中态由 CSS 通过 data-active / aria-selected 呈现 ——
 * 选中与否活在 Base UI 内部，wrapper 拿不到，属于状态驱动，只能交给 CSS。
 */
export default function TabsTrigger(props: SlotProps<"tabsTrigger">) {
    const Host = useHostUI("tabsTrigger");
    if (!Host) return null;

    const { children, ...rest } = props;
    return (
        <Host {...rest}>
            <Tag>[{children}]</Tag>
        </Host>
    );
}
