import { useHostUI, type SlotProps } from "@/plugins/api";

/** 页签面板透传，间距与排版走 CSS。 */
export default function TabsContent(props: SlotProps<"tabsContent">) {
    const Host = useHostUI("tabsContent");
    if (!Host) return null;
    return <Host {...props} />;
}
