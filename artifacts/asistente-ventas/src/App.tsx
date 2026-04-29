import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard";
import InboxPage from "@/pages/inbox";
import InventoryPage from "@/pages/inventory";
import CarDetailPage from "@/pages/car-detail";
import PipelinePage from "@/pages/pipeline";
import SettingsPage from "@/pages/settings";
import LandingPage from "@/pages/landing";
import LandingCarPage from "@/pages/landing-car";
import StaffLogin from "@/pages/staff-login";
import { getStoredToken, isAuthenticated } from "@/lib/staff-auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5_000, refetchOnWindowFocus: false },
  },
});

setAuthTokenGetter(() => getStoredToken());

function CockpitRouter() {
  const [authed, setAuthed] = useState(() => isAuthenticated());

  function handleLogin() {
    setAuthed(true);
    void queryClient.invalidateQueries();
  }

  if (!authed) {
    return <StaffLogin onLogin={handleLogin} />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/pipeline" component={PipelinePage} />
        <Route path="/inbox" component={InboxPage} />
        <Route path="/inbox/:id" component={InboxPage} />
        <Route path="/inventory" component={InventoryPage} />
        <Route path="/cars/:id" component={CarDetailPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  const [location] = useLocation();
  const isPublic = location.startsWith("/tienda");

  if (isPublic) {
    return (
      <Switch>
        <Route path="/tienda" component={LandingPage} />
        <Route path="/tienda/coche/:id" component={LandingCarPage} />
      </Switch>
    );
  }

  return <CockpitRouter />;
}

function App() {
  useEffect(() => {
    setAuthTokenGetter(() => getStoredToken());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
