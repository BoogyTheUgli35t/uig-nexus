import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  PackageCheck,
  Gauge,
  Truck,
  Route as RouteIcon,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { getLogisticsWorkspace } from "@/lib/logistics.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, StatusBadge, KpiStat } from "@/components/portal/blocks";

export const Route = createFileRoute("/_apex/portal/divisions/logistics/")({
  component: LogisticsOverview,
});

function LogisticsOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["logistics-workspace"],
    queryFn: async () => getLogisticsWorkspace({ headers: await authHeaders() }),
  });

  const stats = data?.stats;
  const recent = (data?.shipments ?? []).slice(0, 6);
  const alertCount =
    (stats?.serviceDue ?? 0) + (stats?.insuranceDue ?? 0) + (stats?.licenseDue ?? 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Link
          to="/portal/divisions/intelligence/assistant"
          search={{
            ask: `We have ${stats?.active ?? 0} active shipments and an on-time rate of ${stats?.onTimeRate ?? 0}%. Any patterns or risks worth flagging?`,
          }}
          className="text-sm text-gold hover:underline"
        >
          Ask Intelligence AI about logistics
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat
          icon={PackageCheck}
          label="Active shipments"
          value={stats?.active ?? "—"}
          hint={`${stats?.shipments ?? 0} total`}
        />
        <KpiStat
          icon={Gauge}
          label="On-time rate"
          value={stats ? `${stats.onTimeRate}%` : "—"}
          hint={`${stats?.delivered ?? 0} delivered`}
        />
        <KpiStat
          icon={Truck}
          label="Fleet"
          value={stats?.vehicles ?? "—"}
          hint={`${stats?.inTransitVehicles ?? 0} in transit`}
        />
        <KpiStat
          icon={RouteIcon}
          label="Active routes"
          value={stats?.routes ?? "—"}
          hint={`${stats?.drivers ?? 0} drivers`}
        />
      </div>

      {alertCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
          <div className="text-muted-foreground">
            <span className="font-medium text-foreground">
              {alertCount} item{alertCount === 1 ? "" : "s"}
            </span>{" "}
            need attention in the next 30 days:{" "}
            {stats?.serviceDue
              ? `${stats.serviceDue} vehicle service${stats.serviceDue === 1 ? "" : "s"} due`
              : ""}
            {stats?.serviceDue && (stats?.insuranceDue || stats?.licenseDue) ? " · " : ""}
            {stats?.insuranceDue
              ? `${stats.insuranceDue} insurance renewal${stats.insuranceDue === 1 ? "" : "s"}`
              : ""}
            {stats?.insuranceDue && stats?.licenseDue ? " · " : ""}
            {stats?.licenseDue
              ? `${stats.licenseDue} driver license${stats.licenseDue === 1 ? "" : "s"} expiring`
              : ""}
            {" — see the "}
            <Link to="/portal/divisions/logistics/fleet" className="text-gold hover:underline">
              Fleet
            </Link>{" "}
            and{" "}
            <Link to="/portal/divisions/logistics/drivers" className="text-gold hover:underline">
              Drivers
            </Link>{" "}
            tabs.
          </div>
        </div>
      )}

      <DataPanel
        title="Recent shipments"
        action={{ to: "/portal/divisions/logistics/shipments", label: "View all" }}
      >
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : recent.length === 0 ? (
          <EmptyState icon={PackageCheck} title="No shipments yet" />
        ) : (
          <div className="divide-y divide-border">
            {recent.map((s) => (
              <Link
                key={s.id}
                to="/portal/divisions/logistics/shipments/$id"
                params={{ id: s.id }}
                className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0 hover:opacity-80"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">{s.customer}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {s.pickup_city ?? "—"} → {s.dropoff_city ?? "—"}
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </Link>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
