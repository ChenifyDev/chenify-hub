import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar.tsx";
import AppSidebar from "@/components/layout/Sidebar.tsx";
import { TooltipProvider } from "../ui/tooltip";
import { useBackgroundImage } from "@/hooks/useBackgroundImage";

export default function Layout() {
    useBackgroundImage();

    return (
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar />
                <main className={"w-full"}>
                    <Outlet />
                </main>
            </SidebarProvider>
        </TooltipProvider>
    );
}
