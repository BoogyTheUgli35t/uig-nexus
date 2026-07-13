import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Truck, Fuel, Gauge, Wrench, AlertTriangle } from "lucide-react";
import {
  getLogisticsWorkspace,
  updateVehicleStatus,
  addMaintenanceLog,
  listMaintenanceLogs,
  VEHICLE_STATUSES,
} from "@/lib/logistics.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_apex/portal/divisions/logistics/fleet")({
  component: FleetPage,
});

const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

function FleetPage() {
  const qc = useQueryClient();
  const [logVehicle, setLogVehicle] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["logistics-workspace"],
    queryFn: async () => getLogisticsWorkspace({ headers: await authHeaders() }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["logistics-workspace"] });

  const vehicleStatusMut = useMutation({
    mutationFn: async (v: { id: string; status: (typeof VEHICLE_STATUSES)[number] }) =>
      updateVehicleStatus({ data: v, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Fleet management</h2>
        <p className="text-sm text-muted-foreground">Vehicles, capacity and maintenance records.</p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (data?.vehicles.length ?? 0) === 0 ? (
        <EmptyState icon={Truck} title="No vehicles yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.vehicles ?? []).map((v) => {
            const serviceSoon = v.next_service_due && new Date(v.next_service_due) <= in30;
            const insuranceSoon = v.insurance_expiry && new Date(v.insurance_expiry) <= in30;
            return (
              <div key={v.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-medium">{v.plate}</div>
                    <div className="text-xs capitalize text-muted-foreground">
                      {v.vehicle_type} · {Number(v.capacity_kg).toLocaleString()} kg
                    </div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Fuel className="h-3 w-3" /> {v.fuel_level}%
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Gauge className="h-3 w-3" /> {Number(v.odometer_km).toLocaleString()} km
                  </span>
                </div>
                {(serviceSoon || insuranceSoon) && (
                  <div className="mt-2 flex items-start gap-1.5 rounded border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-[11px] text-destructive">
                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                    <span>
                      {serviceSoon && `Service due ${v.next_service_due}`}
                      {serviceSoon && insuranceSoon ? " · " : ""}
                      {insuranceSoon && `Insurance expires ${v.insurance_expiry}`}
                    </span>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-1">
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
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full text-xs"
                  onClick={() => setLogVehicle(v.id)}
                >
                  <Wrench className="mr-1.5 h-3.5 w-3.5" /> Log maintenance
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {logVehicle && (
        <MaintenanceDialog
          vehicleId={logVehicle}
          plate={data?.vehicles.find((v) => v.id === logVehicle)?.plate ?? ""}
          onClose={() => setLogVehicle(null)}
          onLogged={invalidate}
        />
      )}
    </div>
  );
}

function MaintenanceDialog({
  vehicleId,
  plate,
  onClose,
  onLogged,
}: {
  vehicleId: string;
  plate: string;
  onClose: () => void;
  onLogged: () => void;
}) {
  const qc = useQueryClient();
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");
  const [cost, setCost] = useState("");
  const [performedAt, setPerformedAt] = useState(new Date().toISOString().slice(0, 10));
  const [nextDue, setNextDue] = useState("");

  const { data: logs } = useQuery({
    queryKey: ["logistics-maintenance-logs"],
    queryFn: async () => listMaintenanceLogs({ headers: await authHeaders() }),
  });

  const vehicleLogs = useMemo(
    () => (logs ?? []).filter((l) => l.vehicle_id === vehicleId),
    [logs, vehicleId],
  );

  const addMut = useMutation({
    mutationFn: async () =>
      addMaintenanceLog({
        data: {
          vehicle_id: vehicleId,
          service_type: serviceType,
          notes,
          cost: cost ? Number(cost) : undefined,
          performed_at: performedAt,
          next_due: nextDue,
        },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Maintenance logged");
      setServiceType("");
      setNotes("");
      setCost("");
      setNextDue("");
      qc.invalidateQueries({ queryKey: ["logistics-maintenance-logs"] });
      onLogged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Maintenance — {plate}</DialogTitle>
          <DialogDescription>Log service history and schedule the next check.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (serviceType.trim()) addMut.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label className="text-xs">Service type</Label>
            <Input
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="e.g. Oil change, tyre rotation"
              maxLength={120}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Performed on</Label>
              <Input type="date" value={performedAt} onChange={(e) => setPerformedAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Next due</Label>
              <Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cost (₦)</Label>
            <Input type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
          </div>
          <Button type="submit" disabled={!serviceType.trim() || addMut.isPending}>
            <Wrench className="mr-2 h-4 w-4" /> Log service
          </Button>
        </form>

        <div className="mt-2 max-h-56 space-y-2 overflow-y-auto border-t border-border pt-3">
          {vehicleLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No service history yet.</p>
          ) : (
            vehicleLogs.map((l) => (
              <div key={l.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{l.service_type}</span>
                  <span className="text-[11px] text-muted-foreground">{l.performed_at}</span>
                </div>
                {l.notes && <p className="mt-1 text-xs text-muted-foreground">{l.notes}</p>}
                {l.cost != null && (
                  <p className="mt-1 text-xs text-muted-foreground">₦{Number(l.cost).toLocaleString()}</p>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
