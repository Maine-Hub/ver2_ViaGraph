import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/common/sidebar-nav";
import { AppProvider } from "@/contexts/app-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <SidebarProvider>
        <SidebarNav />
        <SidebarInset className="flex flex-col overflow-hidden h-screen relative">
          <SidebarTrigger className="md:hidden absolute top-4 left-4 z-50 bg-background/50 backdrop-blur shadow-sm rounded-full" />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AppProvider>
  );
}