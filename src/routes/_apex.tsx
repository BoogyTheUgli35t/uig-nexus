import { Outlet, createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, FolderKanban, Settings, LogOut, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_apex")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/portal/login" });
  },
  component: PortalShell,
});

function PortalShell() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/portal/login" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const nav = [
    { to: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/portal/projects", label: "Projects", icon: FolderKanban },
    { to: "/portal/settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-surface/60 p-4">
        <div className="px-2 py-2"><Logo /></div>
        <div className="mt-2 px-2 text-xs uppercase tracking-wider text-muted-foreground">Apex Portal</div>
        <nav className="mt-6 flex-1 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition"
              activeProps={{ className: "bg-surface-elevated text-foreground" }}
            >
              <n.icon className="h-4 w-4" /> {n.label}
              <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />
            </Link>
          ))}
        </nav>
        <div className="border-t border-border pt-4 mt-4">
          <div className="px-2 text-xs text-muted-foreground truncate">{email}</div>
          <Button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/portal/login" }); }}
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden border-b border-border bg-surface/80 backdrop-blur px-4 h-14 flex items-center justify-between">
          <Logo />
          <Button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/portal/login" }); }} variant="ghost" size="sm">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <div className="lg:hidden border-b border-border bg-surface/40 px-4 py-2 flex gap-1 overflow-x-auto">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground" activeProps={{ className: "bg-surface-elevated text-foreground" }}>
              {n.label}
            </Link>
          ))}
        </div>
        <main className="flex-1 p-6 sm:p-8 overflow-x-hidden"><Outlet /></main>
      </div>
    </div>
  );
}
