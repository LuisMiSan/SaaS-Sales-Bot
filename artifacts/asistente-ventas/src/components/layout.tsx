import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, MessageSquare, Car, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/inbox", label: "Buzón", icon: MessageSquare },
    { href: "/inventory", label: "Inventario", icon: Car },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside className="w-60 border-r border-border bg-sidebar flex flex-col shrink-0">
        <div className="px-5 pt-6 pb-8">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold tracking-tight leading-tight">AsistenteVenta</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cockpit comercial</div>
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
                    ? "bg-sidebar-accent text-foreground border border-border"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground border border-transparent",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Metodología</div>
          <div className="text-xs text-foreground/80 mt-1.5 leading-snug">
            Aquí no sube el precio. Aquí pierdes la oportunidad.
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">{children}</main>
    </div>
  );
}
