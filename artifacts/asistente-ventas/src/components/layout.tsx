import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Car, Sparkles, Menu, X, Settings2, BookOpen, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

export function Layout({ children, onLogout }: LayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Close drawer with Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const navItems = [
    { href: "/staff", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/staff/inventory", label: "Inventario", icon: Car },
    { href: "/staff/settings", label: "Configuración", icon: Settings2 },
    { href: "/staff/manuales", label: "Manuales", icon: BookOpen },
  ];

  const navContent = (
    <>
      <div className="px-5 pt-6 pb-8">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold tracking-tight leading-tight text-sidebar-foreground">AsistenteVenta</div>
            <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">Cockpit comercial</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location === item.href
            : location === item.href || location.startsWith(item.href + "/") || location.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground border border-sidebar-border"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground border border-transparent",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">Metodología</div>
          <div className="text-xs text-sidebar-foreground/70 mt-1.5 leading-snug">
            Aquí no sube el precio. Aquí pierdes la oportunidad.
          </div>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        )}
      </div>
    </>
  );

  const currentLabel = navItems.find((i) =>
    i.exact ? location === i.href : location === i.href || location.startsWith(i.href + "/") || location.startsWith(i.href),
  )?.label ?? "Cockpit";

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile top bar */}
      <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-sidebar shrink-0">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="h-9 w-9 -ml-2 rounded-md flex items-center justify-center text-sidebar-foreground/80 hover:bg-sidebar-accent"
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-drawer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div className="text-sm font-semibold tracking-tight">{currentLabel}</div>
        </div>
        <div className="w-9" />
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 border-r border-border bg-sidebar flex-col shrink-0">
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          id="mobile-nav-drawer"
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative w-72 max-w-[85vw] bg-sidebar border-r border-border flex flex-col shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 h-9 w-9 rounded-md flex items-center justify-center text-sidebar-foreground/80 hover:bg-sidebar-accent"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
            {navContent}
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden min-w-0">{children}</main>
    </div>
  );
}
