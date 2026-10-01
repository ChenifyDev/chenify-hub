import { useHostUI, type SlotProps } from "@/plugins/api";
import { cn } from "@/lib/utils";

export default function Input(props: SlotProps<"input">) {
    const Host = useHostUI("input");
    if (!Host) return null;

    return <Host {...props} className={cn("rounded-full bg-primary/5", props.className)} />;
}
