import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar.tsx";
import AppSidebar from "@/components/layout/Sidebar.tsx";
import { TooltipProvider } from "../ui/tooltip";
import { useBackgroundImage } from "@/hooks/useBackgroundImage";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";

export default function Layout() {
    useBackgroundImage();

    return (
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar />
                <main className="flex w-full flex-col">
                    <div className="p-2 md:hidden">
                        <SidebarTrigger />
                    </div>
                    <ScrollArea className={"max-h-screen"}>
                        <Outlet />
                    </ScrollArea>
                </main>
            </SidebarProvider>
        </TooltipProvider>
    );
}
