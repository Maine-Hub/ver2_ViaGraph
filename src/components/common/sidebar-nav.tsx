'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/common/logo";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Map, Shield, Settings, LifeBuoy, Users, FileText } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";

export function SidebarNav() {
  const pathname = usePathname();
  const { role, loading } = useAppContext();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <Separator />
      <SidebarMenu className="flex-1">
        <SidebarMenuItem>
          <Link href="/find-route" passHref>
            <SidebarMenuButton
              isActive={pathname === '/find-route'}
              tooltip="Find Route"
            >
              <Map />
              <span>Find Route</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        {!loading && role === 'admin' && (
          <>
            <SidebarMenuItem>
              <Link href="/admin" passHref>
                <SidebarMenuButton
                  isActive={pathname === '/admin'}
                  tooltip="Admin Dashboard"
                >
                  <Shield />
                  <span>Admin Dashboard</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/admin/users" passHref>
                <SidebarMenuButton
                  isActive={pathname === '/admin/users'}
                  tooltip="Manage Users"
                >
                  <Users />
                  <span>Manage Users</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/admin/activities" passHref>
                <SidebarMenuButton
                  isActive={pathname === '/admin/activities'}
                  tooltip="Activity Log"
                >
                  <FileText />
                  <span>Activity Log</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </>
        )}
      </SidebarMenu>
      <Separator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Support">
              <LifeBuoy />
              <span>Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
