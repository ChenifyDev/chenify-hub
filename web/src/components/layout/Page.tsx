import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils.ts";

export function Page({ className, children }: { className?: string; children: ReactNode }) {
    return <div className={cn("mx-auto w-full max-w-3xl p-4 md:p-6", className)}>{children}</div>;
}

export function PageHeader({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon?: LucideIcon;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
}) {
    return (
        <header className="mb-4 flex items-start justify-between gap-2">
            <div className="grid gap-1">
                <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                    {Icon && <Icon className="size-5 shrink-0" />}
                    <span className="truncate">{title}</span>
                </h1>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {action}
        </header>
    );
}
