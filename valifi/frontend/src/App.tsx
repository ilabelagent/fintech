// Valifi Fintech Platform - Standalone Application
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/storage";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import DashboardNewPage from "@/pages/dashboard-new";
import TradingPage from "@/pages/trading";
import BlockchainPage from "@/pages/blockchain";
import SecurityPage from "@/pages/security";
import PaymentsPage from "@/pages/payments";
import KycPage from "@/pages/kyc";
import ExchangePage from "@/pages/exchange";
import CommunityPage from "@/pages/community";
import ChatPage from "@/pages/chat";
import MetalsPage from "@/pages/metals";
import PreciousMetalsPage from "@/pages/precious-metals";
import NewsPage from "@/pages/news";
import P2PPage from "@/pages/p2p";
import FinancialServicesPage from "@/pages/financial-services";
import StocksPage from "@/pages/stocks";
import ForexPage from "@/pages/forex";
import BondsPage from "@/pages/bonds";
import RetirementPage from "@/pages/retirement";
import WalletSecurityPage from "@/pages/wallet-security";
import AnalyticsIntelligencePage from "@/pages/analytics-intelligence";
import AdminPage from "@/pages/admin";
import WalletConnectPage from "@/pages/wallet-connect";
import AssetsPage from "@/pages/assets";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={LoginPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.firstName} {user?.lastName}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  storage.clearToken();
                  window.location.href = "/";
                }}
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard-new" component={DashboardNewPage} />
              <Route path="/exchange" component={ExchangePage} />
              <Route path="/financial-services" component={FinancialServicesPage} />
              <Route path="/wallet-security" component={WalletSecurityPage} />
              <Route path="/analytics-intelligence" component={AnalyticsIntelligencePage} />
              <Route path="/community" component={CommunityPage} />
              <Route path="/chat" component={ChatPage} />
              <Route path="/metals" component={MetalsPage} />
              <Route path="/precious-metals" component={PreciousMetalsPage} />
              <Route path="/stocks" component={StocksPage} />
              <Route path="/forex" component={ForexPage} />
              <Route path="/bonds" component={BondsPage} />
              <Route path="/retirement" component={RetirementPage} />
              <Route path="/news" component={NewsPage} />
              <Route path="/trading" component={TradingPage} />
              <Route path="/blockchain" component={BlockchainPage} />
              <Route path="/security" component={SecurityPage} />
              <Route path="/payments" component={PaymentsPage} />
              <Route path="/p2p" component={P2PPage} />
              <Route path="/kyc" component={KycPage} />
              <Route path="/wallet-connect" component={WalletConnectPage} />
              <Route path="/assets" component={AssetsPage} />
              <Route path="/admin" component={AdminPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
