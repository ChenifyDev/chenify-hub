import { useHostUI, type SlotProps } from "@/plugins/api";

/** Portal 只负责挂载位置，注入节点会改变弹窗的渲染树，透传即可。 */
export default function DialogPortal(props: SlotProps<"dialogPortal">) {
    const Host = useHostUI("dialogPortal");
    if (!Host) return null;
    return <Host {...props} />;
}
