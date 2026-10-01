import { useHostUI, type SlotProps } from "@/plugins/api";
import { cn } from "@/lib/utils";

export default function Badge(props: SlotProps<"badge">) {
    const Host = useHostUI("badge");
    if (!Host) return null;

    return <Host {...props} className={cn("rounded-full px-2.5 uppercase", props.className)} />;
}
