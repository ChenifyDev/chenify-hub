import { useHostUI, type SlotProps } from "@/plugins/api";

/** 页签条透传；背景改成终端的凹槽样式由 [data-slot="tabs-list"] 的 CSS 完成。 */
export default function TabsList(props: SlotProps<"tabsList">) {
    const Host = useHostUI("tabsList");
    if (!Host) return null;
    return <Host {...props} />;
}
