import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Home,
  Wallet,
  Bot,
  Shield,
  CreditCard,
  FileCheck,
  Zap,
  TrendingUp,
  Coins,
  ShieldCheck,
  Users,
  MessageSquare,
  Newspaper,
  ArrowLeftRight,
  ArrowUpDown,
  Link2,
  Sparkles,
  LayoutDashboard,
  BarChart3,
  Globe,
  Landmark,
  PiggyBank,
  Settings,
  LineChart,
  Database,
  Building2,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

const tradingItems = [
  {
    title: 'Exchange',
    url: '/exchange',
    icon: ArrowLeftRight,
  },
  {
    title: 'Trading Bots',
    url: '/trading-bots',
    icon: Bot,
  },
  {
    title: 'Bot Marketplace',
    url: '/bot-marketplace',
    icon: Sparkles,
    testId: 'link-bot-marketplace',
  },
  {
    title: 'Financial Services',
    url: '/financial-services',
    icon: TrendingUp,
  },
  {
    title: 'Advanced Trading',
    url: '/advanced-trading',
    icon: Zap,
  },
  {
    title: 'Precious Metals',
    url: '/metals',
    icon: Coins,
  },
  {
    title: 'Stocks',
    url: '/stocks',
    icon: BarChart3,
  },
  {
    title: 'Forex',
    url: '/forex',
    icon: Globe,
  },
  {
    title: 'Bonds',
    url: '/bonds',
    icon: Landmark,
  },
  {
    title: 'Retirement',
    url: '/retirement',
    icon: PiggyBank,
  },
];

const blockchainItems = [
  {
    title: 'Wallets',
    url: '/blockchain',
    icon: Wallet,
  },
  {
    title: 'WalletConnect',
    url: '/wallet-connect',
    icon: Link2,
  },
  {
    title: 'Security',
    url: '/wallet-security',
    icon: ShieldCheck,
  },
  {
    title: 'Privacy Mixer',
    url: '/mixer',
    icon: ShieldCheck,
  },
];

const communityItems = [
  {
    title: 'Community',
    url: '/community',
    icon: Users,
  },
  {
    title: 'AI Assistant',
    url: '/chat',
    icon: MessageSquare,
  },
  {
    title: 'News & Updates',
    url: '/news',
    icon: Newspaper,
  },
];

const platformItems = [
  {
    title: 'AI Agents',
    url: '/agents',
    icon: Bot,
  },
  {
    title: 'Security Center',
    url: '/security',
    icon: Shield,
  },
  {
    title: 'Analytics',
    url: '/analytics-intelligence',
    icon: LineChart,
  },
  {
    title: 'Payments',
    url: '/payments',
    icon: CreditCard,
  },
  {
    title: 'P2P Trading',
    url: '/p2p',
    icon: ArrowUpDown,
    testId: 'link-p2p',
  },
  {
    title: 'KYC/Compliance',
    url: '/kyc',
    icon: FileCheck,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Valifi
              </span>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  data-active={location === '/'}
                  className="data-[active=true]:bg-sidebar-accent"
                >
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  data-active={location === '/dashboard-new'}
                  className="data-[active=true]:bg-sidebar-accent"
                  data-testid="link-dashboard-new"
                >
                  <Link href="/dashboard-new">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Advanced Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Trading & Markets */}
        <SidebarGroup>
          <SidebarGroupLabel>Trading & Markets</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tradingItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                    className="data-[active=true]:bg-sidebar-accent"
                    data-testid={item.testId}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Blockchain */}
        <SidebarGroup>
          <SidebarGroupLabel>Blockchain & Wallets</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {blockchainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                    className="data-[active=true]:bg-sidebar-accent"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Platform Services */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform Services</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                    className="data-[active=true]:bg-sidebar-accent"
                    data-testid={item.testId}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Community */}
        <SidebarGroup>
          <SidebarGroupLabel>Community</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {communityItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                    className="data-[active=true]:bg-sidebar-accent"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Only show for admin users */}
        {user?.isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    data-active={location === '/admin'}
                    className="data-[active=true]:bg-sidebar-accent"
                    data-testid="link-admin"
                  >
                    <Link href="/admin">
                      <Settings className="h-4 w-4" />
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
