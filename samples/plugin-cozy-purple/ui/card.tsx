import { useHostUI } from "@/plugins/api";
import { cn } from "@/lib/utils";

export default function Card(props) {
    const Host = useHostUI("card");
    if (!Host) return null;

    return <Host {...props} className={cn("rounded-3xl border border-primary/15", props.className)} />;
}
