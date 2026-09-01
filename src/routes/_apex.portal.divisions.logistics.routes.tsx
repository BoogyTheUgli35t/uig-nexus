import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Route as RouteIcon,
  Gauge,
  Boxes,
  Navigation,
  Plus,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import {
  getLogisticsWorkspace,
  listRouteStops,
  addRouteStop,
  toggleRouteStop,
  assignRouteDriver,
} from "@/lib/logistics.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_apex/portal/divisions/logistics/routes")({
  component: RoutesPage,
});

function RoutesPage() {
  const [openRoute, setOpenRoute] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["logistics-workspace"],
    queryFn: async () => getLogisticsWorkspace({ headers: await authHeaders() }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Route optimisation</h2>
        <p className="text-sm text-muted-foreground">
          Ordered stop lists per corridor. No live routing engine is connected — reordering and
          distance/time figures are entered manually, not computed.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (data?.routes.length ?? 0) === 0 ? (
        <EmptyState icon={RouteIcon} title="No routes yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.routes ?? []).map((r) => {
            const driverName = data?.drivers.find((d) => d.id === r.assigned_driver_id)?.full_name;
            return (
              <button
                key={r.id}
                onClick={() => setOpenRoute(r.id)}
                className="rounded-xl border border-border bg-surface p-5 text-left transition hover:acc-border-soft"
              >
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
                  <span className="inline-flex items-center gap-1">
                    <RouteIcon className="h-3.5 w-3.5" /> {Number(r.distance_km)} km
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Gauge className="h-3.5 w-3.5" /> {Number(r.est_hours)} h
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Boxes className="h-3.5 w-3.5" /> {r.stops} stops
                  </span>
                </div>
                {driverName && (
                  <div className="mt-2 text-xs text-muted-foreground">Assigned: {driverName}</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {openRoute && (
        <RouteStopsDialog
          routeId={openRoute}
          route={data?.routes.find((r) => r.id === openRoute) ?? null}
          drivers={data?.drivers ?? []}
          onClose={() => setOpenRoute(null)}
        />
      )}
    </div>
  );
}

function RouteStopsDialog({
  routeId,
  route,
  drivers,
  onClose,
}: {
  routeId: string;
  route: { name: string; assigned_driver_id: string | null } | null;
  drivers: { id: string; full_name: string }[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [address, setAddress] = useState("");
  const [driverId, setDriverId] = useState(route?.assigned_driver_id ?? "");

  const { data: stops } = useQuery({
    queryKey: ["logistics-route-stops"],
    queryFn: async () => listRouteStops({ headers: await authHeaders() }),
  });

  const routeStops = useMemo(
    () =>
      (stops ?? []).filter((s) => s.route_id === routeId).sort((a, b) => a.sequence - b.sequence),
    [stops, routeId],
  );

  const invalidateStops = () => qc.invalidateQueries({ queryKey: ["logistics-route-stops"] });

  const addStopMut = useMutation({
    mutationFn: async () =>
      addRouteStop({
        data: { route_id: routeId, address, sequence: routeStops.length },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      setAddress("");
      invalidateStops();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async (v: { id: string; completed: boolean }) =>
      toggleRouteStop({ data: v, headers: await authHeaders() }),
    onSuccess: invalidateStops,
    onError: (e: Error) => toast.error(e.message),
  });

  const assignMut = useMutation({
    mutationFn: async () =>
      assignRouteDriver({
        data: { id: routeId, assigned_driver_id: driverId || null },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Driver assigned to route");
      qc.invalidateQueries({ queryKey: ["logistics-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{route?.name ?? "Route"}</DialogTitle>
          <DialogDescription>Ordered stop list and driver assignment.</DialogDescription>
        </DialogHeader>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (driverId !== (route?.assigned_driver_id ?? "")) assignMut.mutate();
          }}
        >
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="h-9 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
          >
            <option value="">Unassigned</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" disabled={assignMut.isPending}>
            Assign
          </Button>
        </form>

        <form
          className="flex gap-2 border-t border-border pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (address.trim()) addStopMut.mutate();
          }}
        >
          <Input
            placeholder="Add stop address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={240}
          />
          <Button type="submit" size="sm" disabled={!address.trim() || addStopMut.isPending}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </form>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {routeStops.length === 0 ? (
            <p className="text-xs text-muted-foreground">No stops added yet.</p>
          ) : (
            routeStops.map((stop, i) => (
              <button
                key={stop.id}
                onClick={() => toggleMut.mutate({ id: stop.id, completed: !stop.completed })}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-background p-3 text-left"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium">
                  {i + 1}
                </span>
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span
                  className={`flex-1 text-sm ${stop.completed ? "text-muted-foreground line-through" : ""}`}
                >
                  {stop.address}
                </span>
                {stop.completed && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
