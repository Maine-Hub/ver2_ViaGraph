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
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Map, Shield, Settings, LifeBuoy, Users, FileText, LogOut } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading, signOut } = useAppContext();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4 px-4 relative overflow-hidden">
        {/* Subtle grid background for cohesion with auth pages */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(94,234,212,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(94,234,212,0.2) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }} />
        <div className="relative z-10">
          <Logo />
        </div>
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
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings" onClick={() => router.push('/profile')}>
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

          {!loading && user && (
            <SidebarMenuItem className="mt-4 pt-4 border-t border-sidebar-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="w-full justify-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://picsum.photos/seed/${user.uid}/100/100`} />
                      <AvatarFallback className="bg-primary/20 text-primary">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left overflow-hidden">
                      <span className="text-sm font-semibold leading-none truncate max-w-[120px] text-white mb-1">
                        {user.username || user.email?.split('@')[0]}
                      </span>
                      <Badge className="h-4 text-[9px] uppercase font-bold py-0 px-1.5 bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30">
                        {role}
                      </Badge>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/profile')}>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => signOut()} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
