import { useHostUI, type SlotProps } from "@/plugins/api";
import { Tag } from "./_shared";

/**
 * 表单标签追加冒号「名称:」。
 * label 是 flex gap-2，用 Tag 合成一个子项才不会得到「名称 :」。
 */
export default function Label(props: SlotProps<"label">) {
    const Host = useHostUI("label");
    if (!Host) return null;

    const { children, ...rest } = props;
    return (
        <Host {...rest}>
            <Tag>{children}:</Tag>
        </Host>
    );
}
