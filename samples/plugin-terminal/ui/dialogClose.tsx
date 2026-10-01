import { useHostUI, type SlotProps } from "@/plugins/api";

/** 关闭按钮自身有 render={<Button/>} 与绝对定位约定，只透传。 */
export default function DialogClose(props: SlotProps<"dialogClose">) {
    const Host = useHostUI("dialogClose");
    if (!Host) return null;
    return <Host {...props} />;
}
