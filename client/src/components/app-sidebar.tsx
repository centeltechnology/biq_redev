import { Link, useLocation } from "wouter";
import { Home, Users, FileText, ClipboardList, Settings, LogOut, Cake, CalendarDays, DollarSign, Shield, CreditCard, Share2, Gift, Ticket, Globe, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const coreItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Requests", url: "/leads", icon: ClipboardList },
  { title: "Quotes", url: "/quotes", icon: FileText },
  { title: "Payments", url: "/payments", icon: CreditCard },
];

const setupItems = [
  { title: "Pricing", url: "/pricing", icon: DollarSign },
  { title: "Express Items", url: "/pricing-calculator", icon: Sparkles },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
];

const growItems = [
  { title: "Your Order Page", url: "/share", icon: Globe },
];

function NavItem({ item, location }: { item: { title: string; url: string; icon: any }; location: string }) {
  const isActive = location === item.url ||
    (item.url !== "/dashboard" && location.startsWith(item.url));
  return (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

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
              {coreItems.map((item) => (
                <NavItem key={item.title} item={item} location={location} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Setup</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {setupItems.map((item) => (
                <NavItem key={item.title} item={item} location={location} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Grow</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {growItems.map((item) => (
                <NavItem key={item.title} item={item} location={location} />
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/refer"}>
                  <Link href="/refer" data-testid="nav-refer-a-friend">
                    <Gift className="h-4 w-4" />
                    <span>Refer a Friend</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {(baker as any)?.isAffiliate && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/referrals"}>
                    <Link href="/referrals" data-testid="nav-affiliate-program">
                      <Share2 className="h-4 w-4" />
                      <span>Affiliate Program</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem item={{ title: "Settings", url: "/settings", icon: Settings }} location={location} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(baker?.role === "admin" || baker?.role === "super_admin") && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {baker?.role === "super_admin" && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin"}>
                      <Link href="/admin" data-testid="nav-admin">
                        <Shield className="h-4 w-4" />
                        <span>Admin</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/admin/support"}>
                    <Link href="/admin/support" data-testid="nav-admin-support">
                      <Ticket className="h-4 w-4" />
                      <span>Support</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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
