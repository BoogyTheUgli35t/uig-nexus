import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Package,
  PackageCheck,
  Phone,
  Route as RouteIcon,
  Star,
  Truck,
  UserCheck,
  Users,
} from "lucide-react";
import { getDriverDetail, updateDriverStatus, DRIVER_STATUSES } from "@/lib/logistics.functions";
import { authHeaders } from "@/lib/auth-headers";
import {
  DataPanel,
  EmptyState,
  KpiStat,
  QueryError,
  StatusBadge,
} from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_apex/portal/divisions/logistics/drivers/$id")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: DriverDetailPage,
});

const OPEN_STATUSES = new Set(["pending", "picked_up", "in_transit"]);

/**
 * One driver's page.
 *
 * Logistics had a shipment detail route but drivers — a first-class entity
 * with its own account link, status, rating and task queue — were a flat list
 * with no click-through at all. Answering "what is this driver carrying right
 * now" meant filtering the shipments board by hand.
 */
function DriverDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["logistics-driver", id],
    queryFn: async () => getDriverDetail({ headers: await authHeaders(), data: { id } }),
  });

  const statusMut = useMutation({
    mutationFn: async (status: (typeof DRIVER_STATUSES)[number]) =>
      updateDriverStatus({ data: { id, status }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Driver status updated");
      qc.invalidateQueries({ queryKey: ["logistics-driver", id] });
      // The drivers list and the dispatch board both read availability.
      qc.invalidateQueries({ queryKey: ["logistics-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) return <QueryError error={error} onRetry={() => refetch()} label="this driver" />;
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading driver…</div>;
  if (!data) return <EmptyState icon={Users} title="Driver not found" />;

  const { driver, vehicle, shipments, routes } = data;
  const open = shipments.filter((s) => OPEN_STATUSES.has(s.status));
  const history = shipments.filter((s) => !OPEN_STATUSES.has(s.status));
  const totalKg = open.reduce((sum, s) => sum + Number(s.weight_kg ?? 0), 0);

  return (
    <div className="space-y-8">
      <Link
        to="/portal/divisions/logistics/drivers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Drivers
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{driver.full_name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {driver.phone && (
              <a
                href={`tel:${driver.phone}`}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <Phone className="h-3.5 w-3.5" /> {driver.phone}
              </a>
            )}
            {vehicle && (
              <span className="inline-flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" /> {vehicle.plate}
                {vehicle.vehicle_type ? ` · ${vehicle.vehicle_type}` : ""}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5" />
              {driver.user_id ? "Portal account linked" : "No portal account linked"}
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={driver.status} />
          <div className="flex flex-wrap justify-end gap-1.5">
            {DRIVER_STATUSES.filter((s) => s !== driver.status).map((s) => (
              <Button
                key={s}
                size="sm"
                variant="outline"
                disabled={statusMut.isPending}
                onClick={() => statusMut.mutate(s)}
                className="h-7 px-2 text-xs capitalize"
              >
                Mark {s.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={Package} label="Open shipments" value={open.length} />
        <KpiStat
          icon={PackageCheck}
          label="Deliveries completed"
          value={driver.deliveries_completed ?? 0}
        />
        <KpiStat
          icon={Star}
          label="Rating"
          value={driver.rating ? Number(driver.rating).toFixed(1) : "—"}
        />
        <KpiStat
          icon={Truck}
          label="Load on board"
          value={totalKg > 0 ? `${totalKg.toLocaleString()} kg` : "—"}
          hint={open.length > 0 ? `across ${open.length} shipments` : undefined}
        />
      </div>

      {!driver.user_id && (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-5">
          <h3 className="font-semibold">This driver can&rsquo;t see their own tasks yet.</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Until a portal account is linked to this record, their stops have to be relayed by
            phone. Link one from the drivers list and they get the Driver tasks view on their own
            device.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4">
            <Link to="/portal/divisions/logistics/drivers">Link an account</Link>
          </Button>
        </div>
      )}

      <DataPanel title={`On board now (${open.length})`}>
        {open.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nothing assigned right now"
            description="Assign a shipment from the dispatch board and it appears here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {open.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    to="/portal/divisions/logistics/shipments/$id"
                    params={{ id: s.id }}
                    className="text-sm font-medium hover:underline"
                  >
                    {s.reference}
                  </Link>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {s.customer} · {s.pickup_city} → {s.dropoff_city}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {s.cargo}
                    {s.weight_kg ? ` · ${Number(s.weight_kg).toLocaleString()} kg` : ""}
                    {s.eta ? ` · ETA ${new Date(s.eta).toLocaleDateString()}` : ""}
                  </div>
                </div>
                <StatusBadge status={s.status} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.priority}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DataPanel>

      <DataPanel title={`Assigned routes (${routes.length})`}>
        {routes.length === 0 ? (
          <EmptyState
            icon={RouteIcon}
            title="No routes assigned"
            description="Routes are assigned from the route optimisation page."
          />
        ) : (
          <ul className="divide-y divide-border">
            {routes.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {r.origin} → {r.destination}
                    {r.stops ? ` · ${r.stops} stops` : ""}
                    {r.distance_km ? ` · ${Number(r.distance_km)} km` : ""}
                    {r.est_hours ? ` · ~${Number(r.est_hours)}h` : ""}
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </DataPanel>

      {history.length > 0 && (
        <DataPanel title={`Delivery history (${history.length})`}>
          <ul className="divide-y divide-border">
            {history.slice(0, 20).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <Link
                  to="/portal/divisions/logistics/shipments/$id"
                  params={{ id: s.id }}
                  className="min-w-0 flex-1 truncate hover:underline"
                >
                  {s.reference}{" "}
                  <span className="text-xs text-muted-foreground">
                    · {s.pickup_city} → {s.dropoff_city}
                  </span>
                </Link>
                <StatusBadge status={s.status} />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
          {history.length > 20 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Showing the 20 most recent of {history.length}.
            </p>
          )}
        </DataPanel>
      )}
    </div>
  );
}
