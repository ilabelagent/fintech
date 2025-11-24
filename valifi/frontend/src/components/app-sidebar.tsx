import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Home,
  Wallet,
  ArrowLeftRight,
  ArrowUpDown,
  CreditCard,
  FileCheck,
  Landmark,
  TrendingUp,
  Crown,
  DollarSign,
  Settings,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

const coreItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Portfolio & Assets",
    url: "/assets",
    icon: Wallet,
  },
  {
    title: "Exchange Platform",
    url: "/exchange",
    icon: ArrowLeftRight,
  },
  {
    title: "P2P Trading",
    url: "/p2p",
    icon: ArrowUpDown,
  },
  {
    title: "Precious Metals",
    url: "/precious-metals",
    icon: Crown,
  },
];

const financialItems = [
  {
    title: "Payments",
    url: "/payments",
    icon: DollarSign,
  },
  {
    title: "Loans",
    url: "/loans",
    icon: TrendingUp,
  },
  {
    title: "Valifi Card",
    url: "/card",
    icon: CreditCard,
  },
  {
    title: "Bank Accounts",
    url: "/bank-accounts",
    icon: Landmark,
  },
];

const accountItems = [
  {
    title: "KYC/Compliance",
    url: "/kyc",
    icon: FileCheck,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold">
            Valifi Fintech
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {coreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Financial Services</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financialItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === '/admin'}>
                    <Link href="/admin">
                      <Settings className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
