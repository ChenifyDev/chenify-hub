import { useHostUI, type SlotProps } from "@/plugins/api";
import { cn } from "@/lib/utils";

export default function Card(props: SlotProps<"card">) {
    const Host = useHostUI("card");
    if (!Host) return null;

    return <Host {...props} className={cn("rounded-3xl border border-primary/15", props.className)} />;
}
