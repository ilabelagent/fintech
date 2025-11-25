// Valifi Fintech Platform - Standalone Application
import { Switch, Route, useLocation } from "wouter";
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
import AssetsPage from "@/pages/assets";
import ExchangePage from "@/pages/exchange";
import P2PPage from "@/pages/p2p";
import PreciousMetalsPage from "@/pages/precious-metals";
import PaymentsPage from "@/pages/payments";
import LoansPage from "@/pages/loans";
import CardPage from "@/pages/card";
import BankAccountsPage from "@/pages/bank-accounts";
import KycPage from "@/pages/kyc";
import SettingsPage from "@/pages/settings";
import AdminPage from "@/pages/admin";
import { useEffect } from "react";
import { attachGlobalErrorHandlers, trackEvent, trackPageView } from "@/lib/telemetry";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    trackPageView(location);
  }, [location]);

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
                {user?.fullName || user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  trackEvent({ name: "logout_clicked" });
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
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/assets" component={AssetsPage} />
              <Route path="/exchange" component={ExchangePage} />
              <Route path="/p2p" component={P2PPage} />
              <Route path="/precious-metals" component={PreciousMetalsPage} />
              <Route path="/payments" component={PaymentsPage} />
              <Route path="/loans" component={LoansPage} />
              <Route path="/card" component={CardPage} />
              <Route path="/bank-accounts" component={BankAccountsPage} />
              <Route path="/kyc" component={KycPage} />
              <Route path="/settings" component={SettingsPage} />
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
  useEffect(() => {
    attachGlobalErrorHandlers();
  }, []);

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
