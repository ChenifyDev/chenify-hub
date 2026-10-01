import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar.tsx";
import AppSidebar from "@/components/layout/Sidebar.tsx";
import { TooltipProvider } from "../ui/tooltip";
import { useBackgroundImage } from "@/hooks/useBackgroundImage";

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
                    <Outlet />
                </main>
            </SidebarProvider>
        </TooltipProvider>
    );
}
