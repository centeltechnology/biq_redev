import { Link, useLocation } from "wouter";
import { Home, Users, FileText, ClipboardList, Settings, LogOut, Cake, CalendarDays, DollarSign } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Leads", url: "/leads", icon: ClipboardList },
  { title: "Quotes", url: "/quotes", icon: FileText },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Pricing", url: "/pricing", icon: DollarSign },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { baker, logout, isLoggingOut } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
            <Cake className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base">BakerIQ</span>
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {baker?.businessName}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url !== "/dashboard" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => logout()}
          disabled={isLoggingOut}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
