import { useState, useEffect, useCallback } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard";
import InventoryPage from "@/pages/inventory";
import CarDetailPage from "@/pages/car-detail";
import SettingsPage from "@/pages/settings";
import ManualesPage from "@/pages/manuales";
import LandingPage from "@/pages/landing";
import LandingCarPage from "@/pages/landing-car";
import PrivacyPage from "@/pages/legal-privacy";
import CookiesPage from "@/pages/legal-cookies";
import TermsPage from "@/pages/legal-terms";
import StaffLogin from "@/pages/staff-login";
import { CookieConsent } from "@/components/cookie-consent";
import { checkSession, logout as doLogout } from "@/lib/staff-auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 4,
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 15_000),
    },
  },
});

// No bearer token needed — auth is handled via HttpOnly session cookie.
setAuthTokenGetter(null);

function CockpitRouter() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    checkSession().then((ok) => setAuthed(ok));
  }, []);

  const handleLogin = useCallback(() => {
    setAuthed(true);
    void queryClient.invalidateQueries();
  }, []);

  const handleLogout = useCallback(async () => {
    await doLogout();
    setAuthed(false);
    void queryClient.clear();
  }, []);

  if (authed === null) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-400 text-sm">Cargando…</div>
      </div>
    );
  }

  if (!authed) {
    return <StaffLogin onLogin={handleLogin} />;
  }

  return (
    <Layout onLogout={handleLogout}>
      <Switch>
        <Route path="/staff" component={DashboardPage} />
        <Route path="/staff/inventory" component={InventoryPage} />
        <Route path="/staff/cars/:id" component={CarDetailPage} />
        <Route path="/staff/settings" component={SettingsPage} />
        <Route path="/staff/manuales" component={ManualesPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

function TitledLanding() {
  usePageTitle("Pujamostucoche.es — Compra coches a precio mayorista");
  return <LandingPage />;
}

function TitledLandingCar() {
  usePageTitle("Pujamostucoche.es — Ficha del vehículo");
  return <LandingCarPage />;
}

function Router() {
  const [location] = useLocation();
  const isStaff = location.startsWith("/staff");

  if (isStaff) {
    return <CockpitRouter />;
  }

  return (
    <Switch>
      <Route path="/" component={TitledLanding} />
      <Route path="/coche/:id" component={TitledLandingCar} />
      <Route path="/privacidad" component={PrivacyPage} />
      <Route path="/cookies" component={CookiesPage} />
      <Route path="/terminos" component={TermsPage} />
      <Route path="/tienda" component={TitledLanding} />
      <Route path="/tienda/coche/:id" component={TitledLandingCar} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
          <CookieConsent />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
