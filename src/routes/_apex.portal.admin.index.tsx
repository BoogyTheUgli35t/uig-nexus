import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  UserCheck,
  Users,
  ScrollText,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Megaphone,
  Activity,
  Database,
} from "lucide-react";
import { getAdminOverview } from "@/lib/portal.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, KpiStat } from "@/components/portal/blocks";

export const Route = createFileRoute("/_apex/portal/admin/")({
  head: () => ({ meta: [{ title: "Admin — UIG Apex" }, { name: "robots", content: "noindex" }] }),
  component: AdminOverviewPage,
});

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

const QUICK_LINKS = [
  {
    to: "/portal/admin/access-requests" as const,
    label: "Access requests",
    description: "Review who's asking for portal access and grant roles.",
    icon: UserCheck,
  },
  {
    to: "/portal/admin/users" as const,
    label: "Users",
    description: "Every portal account — edit role and division access.",
    icon: Users,
  },
  {
    to: "/portal/admin/audit" as const,
    label: "Audit log",
    description: "Filter events by user, division and time range.",
    icon: ScrollText,
  },
  {
    to: "/portal/admin/system" as const,
    label: "System oversight",
    description: "Company-wide activity across every division.",
    icon: Activity,
  },
  {
    to: "/portal/admin/broadcast" as const,
    label: "Broadcast",
    description: "Send an announcement to all users, a division or a role.",
    icon: Megaphone,
  },
  {
    to: "/portal/admin/data" as const,
    label: "Division data",
    description: "Record counts per division and one-click sample data seeding.",
    icon: Database,
  },
  {
    to: "/portal/admin/division-access" as const,
    label: "Division access",
    description: "Appoint division admins who manage their own division's team.",
    icon: ShieldCheck,
  },
  {
    to: "/portal/billing" as const,
    label: "Billing",
    description: "Stripe transactions across every division.",
    icon: CreditCard,
  },
];

function AdminOverviewPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => getAdminOverview({ headers: await authHeaders() }),
  });

  if (error) return <div className="text-destructive text-sm">{(error as Error).message}</div>;

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <p className="text-sm text-gold uppercase tracking-wider">Admin</p>
        <h1 className="mt-2 text-3xl font-bold">Admin overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything an admin needs, in one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat
          icon={Users}
          label="Portal accounts"
          value={isLoading ? "—" : (data?.totalUsers ?? 0)}
        />
        <KpiStat
          icon={UserCheck}
          label="Pending access requests"
          value={isLoading ? "—" : (data?.pendingRequests ?? 0)}
          hint={data && data.pendingRequests > 0 ? "Needs review" : undefined}
        />
        <KpiStat
          icon={ShieldCheck}
          label="Admins / staff"
          value={isLoading ? "—" : (data?.roleCounts.admin ?? 0) + (data?.roleCounts.staff ?? 0)}
        />
        <KpiStat
          icon={CreditCard}
          label="Revenue collected"
          value={isLoading ? "—" : naira(data?.billing.totalPaidKobo ?? 0)}
          hint={data ? `${data.billing.pendingCount} pending` : undefined}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-5 transition hover:border-gold/40"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
              <link.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-medium">
                {link.label}
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <DataPanel title="Roles at a glance">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !data || Object.keys(data.roleCounts).length === 0 ? (
          <EmptyState icon={Users} title="No roles assigned yet" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.roleCounts).map(([role, count]) => (
              <span
                key={role}
                className="rounded-full border border-border px-3 py-1 text-xs capitalize text-muted-foreground"
              >
                {role}: <span className="font-medium text-foreground">{count}</span>
              </span>
            ))}
          </div>
        )}
      </DataPanel>

      <DataPanel
        title="Recent activity"
        action={{ to: "/portal/admin/audit", label: "View full log" }}
      >
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !data || data.recentAudit.length === 0 ? (
          <EmptyState icon={ScrollText} title="No activity yet" />
        ) : (
          <div className="divide-y divide-border">
            {data.recentAudit.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <span className="capitalize">{entry.event_type.replace(/_/g, " ")}</span>
                  {entry.email && <span className="text-muted-foreground"> · {entry.email}</span>}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
