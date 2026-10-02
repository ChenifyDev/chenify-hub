import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils.ts";

export default function Empty({
    text,
    icon: Icon,
    className,
}: {
    text: ReactNode;
    icon?: LucideIcon;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "grid justify-items-center gap-1.5 py-10 text-center text-sm text-muted-foreground",
                className,
            )}
        >
            {Icon && (
                <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-5" />
                </span>
            )}
            <p>{text}</p>
        </div>
    );
}
