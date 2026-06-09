import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Lock,
  Plus,
  Truck,
  PackageCheck,
  Boxes,
  Gauge,
  MapPin,
  Star,
  Fuel,
  Route as RouteIcon,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import { getDivision } from "@/lib/divisions";
import { getMyWorkspace } from "@/lib/divisions.functions";
import {
  getLogisticsWorkspace,
  addShipment,
  updateShipmentStatus,
  updateVehicleStatus,
  SHIPMENT_STATUSES,
  VEHICLE_STATUSES,
} from "@/lib/logistics.functions";
import { authHeaders } from "@/lib/auth-headers";
import { HeroBanner, KpiStat, DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_apex/portal/divisions/logistics")({
  head: () => ({ meta: [{ title: "UIG Logistics — Workspace" }, { name: "robots", content: "noindex" }] }),
  component: LogisticsWorkspace,
});

const SHIPMENT_COLUMNS: { key: (typeof SHIPMENT_STATUSES)[number]; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "picked_up", label: "Picked up" },
  { key: "in_transit", label: "In transit" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

function LogisticsWorkspace() {
  const division = getDivision("logistics")!;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const [customer, setCustomer] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const ws = await getMyWorkspace({ headers: await authHeaders() });
        setHasAccess(ws.isAdmin || ws.divisionSlugs.includes("logistics"));
      } catch {
        setHasAccess(false);
      }
    })();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["logistics-workspace"],
    enabled: hasAccess === true,
    queryFn: async () => getLogisticsWorkspace({ headers: await authHeaders() }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["logistics-workspace"] });

  const shipmentMut = useMutation({
    mutationFn: async () =>
      addShipment({
        data: { customer, pickup_city: pickup, dropoff_city: dropoff },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Shipment created");
      setCustomer("");
      setPickup("");
      setDropoff("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const shipStatusMut = useMutation({
    mutationFn: async (v: { id: string; status: (typeof SHIPMENT_STATUSES)[number] }) =>
      updateShipmentStatus({ data: v, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const vehicleStatusMut = useMutation({
    mutationFn: async (v: { id: string; status: (typeof VEHICLE_STATUSES)[number] }) =>
      updateVehicleStatus({ data: v, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const driverName = useMemo(() => {
    const m = new Map<string, string>();
    (data?.drivers ?? []).forEach((d) => m.set(d.id, d.full_name));
    return m;
  }, [data]);

  const routeName = useMemo(() => {
    const m = new Map<string, string>();
    (data?.routes ?? []).forEach((r) => m.set(r.id, r.name));
    return m;
  }, [data]);

  const shipmentsByStatus = useMemo(() => {
    const m = new Map<string, NonNullable<typeof data>["shipments"]>();
    SHIPMENT_COLUMNS.forEach((c) => m.set(c.key, []));
    (data?.shipments ?? []).forEach((s) => {
      if (!m.has(s.status)) m.set(s.status, []);
      m.get(s.status)!.push(s);
    });
    return m;
  }, [data]);

  if (hasAccess === null) return <div className="text-muted-foreground">Loading workspace…</div>;

  if (!hasAccess) {
    return (
      <div className="max-w-lg">
        <EmptyState
          icon={Lock}
          title="No access to UIG Logistics"
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

  const stats = data?.stats;

  return (
    <div className={`space-y-8 ${division.accentClass}`}>
      <Link to="/portal/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <HeroBanner
        division={division}
        eyebrow={division.short}
        title={division.name}
        subtitle="Track shipments, manage drivers and fleet, and optimise routes across Nigeria from one control tower."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={PackageCheck} label="Active shipments" value={stats?.active ?? "—"} hint={`${stats?.shipments ?? 0} total`} />
        <KpiStat icon={Gauge} label="On-time rate" value={stats ? `${stats.onTimeRate}%` : "—"} hint={`${stats?.delivered ?? 0} delivered`} />
        <KpiStat icon={Truck} label="Fleet" value={stats?.vehicles ?? "—"} hint={`${stats?.inTransitVehicles ?? 0} in transit`} />
        <KpiStat icon={RouteIcon} label="Active routes" value={stats?.routes ?? "—"} hint={`${stats?.drivers ?? 0} drivers`} />
      </div>

      {/* New shipment */}
      <DataPanel title="Create a shipment">
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (customer.trim()) shipmentMut.mutate();
          }}
        >
          <Input placeholder="Customer" value={customer} onChange={(e) => setCustomer(e.target.value)} maxLength={180} />
          <Input placeholder="Pickup city" value={pickup} onChange={(e) => setPickup(e.target.value)} maxLength={120} />
          <Input placeholder="Drop-off city" value={dropoff} onChange={(e) => setDropoff(e.target.value)} maxLength={120} />
          <Button type="submit" disabled={!customer.trim() || shipmentMut.isPending}>
            <Plus className="mr-2 h-4 w-4" /> Create
          </Button>
        </form>
      </DataPanel>

      {/* Shipment tracking board */}
      <div>
        <h2 className="text-lg font-semibold">Shipment tracking</h2>
        <p className="text-sm text-muted-foreground">Live status board across the delivery pipeline.</p>
        {isLoading ? (
          <div className="mt-4 text-sm text-muted-foreground">Loading shipments…</div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {SHIPMENT_COLUMNS.map((col) => {
              const items = shipmentsByStatus.get(col.key) ?? [];
              return (
                <div key={col.key} className="rounded-xl border border-border bg-surface p-3">
                  <div className="flex items-center justify-between px-1 pb-2 text-xs font-medium text-muted-foreground">
                    <span>{col.label}</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border py-4 text-center text-[11px] text-muted-foreground">
                        Empty
                      </div>
                    ) : (
                      items.map((s) => {
                        const idx = SHIPMENT_STATUSES.indexOf(s.status as (typeof SHIPMENT_STATUSES)[number]);
                        const next = idx >= 0 && idx < SHIPMENT_STATUSES.length - 2 ? SHIPMENT_STATUSES[idx + 1] : null;
                        return (
                          <div key={s.id} className="rounded-lg border border-border bg-background p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[11px] text-muted-foreground">{s.reference}</span>
                              <span className="font-mono text-[10px] acc-text">{s.tracking_code}</span>
                            </div>
                            <div className="mt-1 text-sm font-medium leading-snug">{s.customer}</div>
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {s.pickup_city ?? "—"} → {s.dropoff_city ?? "—"}
                            </div>
                            {s.cargo && <div className="mt-1 truncate text-[11px] text-muted-foreground">{s.cargo}</div>}
                            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                              {s.driver_id && <span>{driverName.get(s.driver_id) ?? "—"}</span>}
                              {s.eta && <span>ETA {s.eta}</span>}
                            </div>
                            {next && next !== "failed" && (
                              <button
                                type="button"
                                onClick={() => shipStatusMut.mutate({ id: s.id, status: next })}
                                className="mt-2 w-full rounded border border-border px-1.5 py-1 text-[10px] capitalize text-muted-foreground transition hover:acc-border-soft hover:text-foreground"
                              >
                                Move to {next.replace(/_/g, " ")}
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fleet + Drivers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DataPanel title="Fleet management">
          {(data?.vehicles.length ?? 0) === 0 ? (
            <EmptyState icon={Truck} title="No vehicles yet" />
          ) : (
            <div className="space-y-3">
              {(data?.vehicles ?? []).map((v) => (
                <div key={v.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-medium">{v.plate}</div>
                      <div className="text-xs capitalize text-muted-foreground">
                        {v.vehicle_type} · {Number(v.capacity_kg).toLocaleString()} kg
                      </div>
                    </div>
                    <StatusBadge status={v.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Fuel className="h-3 w-3" /> {v.fuel_level}%</span>
                    <span className="inline-flex items-center gap-1"><Gauge className="h-3 w-3" /> {Number(v.odometer_km).toLocaleString()} km</span>
                    {v.last_service && <span>Serviced {v.last_service}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {VEHICLE_STATUSES.filter((s) => s !== v.status).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => vehicleStatusMut.mutate({ id: v.id, status: s })}
                        className="rounded border border-border px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground transition hover:acc-border-soft hover:text-foreground"
                      >
                        {s.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DataPanel>

        <DataPanel title="Driver tasks">
          {(data?.drivers.length ?? 0) === 0 ? (
            <EmptyState icon={PackageCheck} title="No drivers yet" />
          ) : (
            <div className="space-y-3">
              {(data?.drivers ?? []).map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{d.full_name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {d.phone ?? "—"} · {d.deliveries_completed.toLocaleString()} deliveries
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="inline-flex items-center gap-1 text-sm font-medium acc-text">
                      <Star className="h-3.5 w-3.5" /> {Number(d.rating).toFixed(1)}
                    </div>
                    <div className="mt-1">
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DataPanel>
      </div>

      {/* Route optimization */}
      <div>
        <h2 className="text-lg font-semibold">Route optimisation</h2>
        <p className="text-sm text-muted-foreground">AI-assisted routing across key corridors.</p>
        {(data?.routes.length ?? 0) === 0 ? (
          <div className="mt-4">
            <EmptyState icon={RouteIcon} title="No routes yet" />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.routes ?? []).map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium leading-snug">{r.name}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Navigation className="h-3 w-3" /> {r.origin} → {r.destination}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><RouteIcon className="h-3.5 w-3.5" /> {Number(r.distance_km)} km</span>
                  <span className="inline-flex items-center gap-1"><Gauge className="h-3.5 w-3.5" /> {Number(r.est_hours)} h</span>
                  <span className="inline-flex items-center gap-1"><Boxes className="h-3.5 w-3.5" /> {r.stops} stops</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
