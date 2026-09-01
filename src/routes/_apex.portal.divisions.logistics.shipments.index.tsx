import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, MapPin, Zap } from "lucide-react";
import {
  getLogisticsWorkspace,
  addShipment,
  updateShipmentStatus,
  SHIPMENT_STATUSES,
  PRIORITY_LEVELS,
} from "@/lib/logistics.functions";
import { authHeaders } from "@/lib/auth-headers";
import { StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_apex/portal/divisions/logistics/shipments/")({
  component: ShipmentsBoard,
});

const SHIPMENT_COLUMNS: { key: (typeof SHIPMENT_STATUSES)[number]; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "picked_up", label: "Picked up" },
  { key: "in_transit", label: "In transit" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

const PRIORITY_STYLE: Record<string, string> = {
  express: "text-destructive",
  fragile: "text-gold",
  standard: "text-muted-foreground",
};

function ShipmentsBoard() {
  const qc = useQueryClient();
  const [customer, setCustomer] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITY_LEVELS)[number]>("standard");

  const { data, isLoading } = useQuery({
    queryKey: ["logistics-workspace"],
    queryFn: async () => getLogisticsWorkspace({ headers: await authHeaders() }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["logistics-workspace"] });

  const shipmentMut = useMutation({
    mutationFn: async () =>
      addShipment({
        data: { customer, pickup_city: pickup, dropoff_city: dropoff, priority },
        headers: await authHeaders(),
      }),
    onSuccess: (res) => {
      toast.success(`Shipment created — tracking code ${res.tracking_code}`);
      setCustomer("");
      setPickup("");
      setDropoff("");
      setPriority("standard");
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

  const shipmentsByStatus = new Map<string, NonNullable<typeof data>["shipments"]>();
  SHIPMENT_COLUMNS.forEach((c) => shipmentsByStatus.set(c.key, []));
  (data?.shipments ?? []).forEach((s) => {
    if (!shipmentsByStatus.has(s.status)) shipmentsByStatus.set(s.status, []);
    shipmentsByStatus.get(s.status)!.push(s);
  });

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (customer.trim()) shipmentMut.mutate();
        }}
      >
        <Input
          placeholder="Customer"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          maxLength={180}
        />
        <Input
          placeholder="Pickup city"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          maxLength={120}
        />
        <Input
          placeholder="Drop-off city"
          value={dropoff}
          onChange={(e) => setDropoff(e.target.value)}
          maxLength={120}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as (typeof PRIORITY_LEVELS)[number])}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          {PRIORITY_LEVELS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={!customer.trim() || shipmentMut.isPending}>
          <Plus className="mr-2 h-4 w-4" /> Create
        </Button>
      </form>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading shipments…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                      const idx = SHIPMENT_STATUSES.indexOf(
                        s.status as (typeof SHIPMENT_STATUSES)[number],
                      );
                      const next =
                        idx >= 0 && idx < SHIPMENT_STATUSES.length - 2
                          ? SHIPMENT_STATUSES[idx + 1]
                          : null;
                      return (
                        <div
                          key={s.id}
                          className="rounded-lg border border-border bg-background p-3"
                        >
                          <Link
                            to="/portal/divisions/logistics/shipments/$id"
                            params={{ id: s.id }}
                            className="block hover:opacity-80"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {s.reference}
                              </span>
                              <span className="font-mono text-[10px] acc-text">
                                {s.tracking_code}
                              </span>
                            </div>
                            <div className="mt-1 text-sm font-medium leading-snug">
                              {s.customer}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {s.pickup_city ?? "—"} →{" "}
                              {s.dropoff_city ?? "—"}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                              {s.priority !== "standard" && (
                                <span
                                  className={`inline-flex items-center gap-0.5 font-medium capitalize ${PRIORITY_STYLE[s.priority] ?? ""}`}
                                >
                                  <Zap className="h-3 w-3" /> {s.priority}
                                </span>
                              )}
                              {s.eta && <span className="text-muted-foreground">ETA {s.eta}</span>}
                            </div>
                          </Link>
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
  );
}
