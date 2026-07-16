import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Lock, LayoutGrid, Users, MapPinned, Layers, AlertTriangle, Radio, CloudSun } from "lucide-react";
import { getDivision } from "@/lib/divisions";
import { useDivisionAccess } from "@/hooks/use-division-access";
import { HeroBanner, EmptyState } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_apex/portal/divisions/agritech")({
  head: () => ({
    meta: [{ title: "UIG AgriTech — Workspace" }, { name: "robots", content: "noindex" }],
  }),
  component: AgritechLayout,
});

const TABS = [
  { to: "/portal/divisions/agritech", label: "Overview", icon: LayoutGrid, exact: true },
  { to: "/portal/divisions/agritech/farmers", label: "Farmers", icon: Users },
  { to: "/portal/divisions/agritech/fields", label: "Fields", icon: MapPinned },
  { to: "/portal/divisions/agritech/sensors", label: "Sensors", icon: Radio },
  { to: "/portal/divisions/agritech/predictions", label: "Predictions", icon: CloudSun },
  { to: "/portal/divisions/agritech/cooperatives", label: "Cooperatives", icon: Layers },
  { to: "/portal/divisions/agritech/alerts", label: "Alerts", icon: AlertTriangle },
] as const;

function AgritechLayout() {
  const division = getDivision("agritech")!;
  const navigate = useNavigate();
  const hasAccess = useDivisionAccess("agritech");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (hasAccess === null) return <div className="text-muted-foreground">Loading workspace…</div>;

  if (!hasAccess) {
    return (
      <div className="max-w-lg">
        <EmptyState
          icon={Lock}
          title="No access to UIG AgriTech"
          description="You don't have access to this division workspace yet. Request access from an administrator."
        />
        <div className="mt-6">
          <Button variant="outline" onClick={() => navigate({ to: "/portal/dashboard" })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${division.accentClass}`}>
      <Link
        to="/portal/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <HeroBanner
        division={division}
        eyebrow={division.short}
        title={division.name}
        subtitle="Onboard farmers, monitor fields with live sensor data and forecast yields across the network."
      />

      <nav className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1.5">
        {TABS.map((tab) => {
          const active = "exact" in tab && tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                active && "acc-bg-soft acc-text",
              )}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
