import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Header } from "@/components/common/header";
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
        <SidebarInset className="flex flex-col overflow-hidden h-screen">
          <Header />
          <main className="flex-1 overflow-hidden p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AppProvider>
  );
}
