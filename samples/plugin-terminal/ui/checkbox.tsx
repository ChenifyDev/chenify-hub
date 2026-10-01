import { useHostUI, type SlotProps } from "@/plugins/api";

/**
 * 复选框只透传。
 *
 * 勾选状态活在 Base UI 内部（wrapper 拿不到），只能靠宿主下发的 data-checked
 * 交给 CSS：隐藏自带的对勾图标，改成在方框里显示终端式的 x。
 * 宿主的 checkbox-indicator 是插槽白名单之外的内部节点，无法单独覆盖。
 */
export default function Checkbox(props: SlotProps<"checkbox">) {
    const Host = useHostUI("checkbox");
    if (!Host) return null;
    return <Host {...props} />;
}
