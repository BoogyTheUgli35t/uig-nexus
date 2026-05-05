import { Outlet, createFileRoute, redirect, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, FolderKanban, Settings, LogOut, ChevronRight, AlertTriangle, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";

const ALLOWED_ROLES = ["admin", "staff", "client"] as const;

export const Route = createFileRoute("/_apex")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw redirect({ to: "/portal/login" });

    const userId = sessionData.session.user.id;
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      throw new Error("Could not verify your portal access. Please try again.");
    }
    const hasAccess = (roles ?? []).some((r) => ALLOWED_ROLES.includes(r.role as typeof ALLOWED_ROLES[number]));
    if (!hasAccess) {
      throw new Error("Your account does not yet have access to the Apex Portal. Contact your UIG administrator to request access.");
    }
  },
  component: PortalShell,
  errorComponent: PortalErrorBoundary,
  notFoundComponent: PortalNotFound,
});

function PortalErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-gold/10 text-gold flex items-center justify-center">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Portal access issue</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message || "Something went wrong while loading the portal."}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => { router.invalidate(); reset(); }} className="bg-gold text-gold-foreground hover:bg-gold/90">Try again</Button>
          <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/portal/login" }); }}>Sign out</Button>
          <Button variant="ghost" asChild><Link to="/">Back to UIG</Link></Button>
        </div>
      </div>
    </div>
  );
}

function PortalNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-surface-elevated text-muted-foreground flex items-center justify-center">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">The portal page you are looking for does not exist.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90"><Link to="/portal/dashboard">Go to dashboard</Link></Button>
          <Button asChild variant="outline"><Link to="/">Back to UIG</Link></Button>
        </div>
      </div>
    </div>
  );
}

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
