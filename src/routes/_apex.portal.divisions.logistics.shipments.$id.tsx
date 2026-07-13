import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  FileSignature,
  Truck as TruckIcon,
} from "lucide-react";
import {
  getShipmentDetail,
  assignShipment,
  completeDeliveryWithPod,
  updateShipmentStatus,
  SHIPMENT_STATUSES,
} from "@/lib/logistics.functions";
import { authHeaders } from "@/lib/auth-headers";
import { supabase } from "@/integrations/supabase/client";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_apex/portal/divisions/logistics/shipments/$id")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: ShipmentDetailPage,
});

function podUrl(path: string) {
  return supabase.storage.from("pod-photos").getPublicUrl(path).data.publicUrl;
}

function ShipmentDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [driverId, setDriverId] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoPath, setPhotoPath] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["logistics-shipment", id],
    queryFn: async () => getShipmentDetail({ headers: await authHeaders(), data: { id } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["logistics-shipment", id] });

  const assignMut = useMutation({
    mutationFn: async () =>
      assignShipment({ data: { id, driver_id: driverId || null }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Driver assigned");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: async (status: (typeof SHIPMENT_STATUSES)[number]) =>
      updateShipmentStatus({ data: { id, status }, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const podMut = useMutation({
    mutationFn: async () =>
      completeDeliveryWithPod({
        data: {
          id,
          pod_photo_url: photoPath ?? "",
          pod_signature_name: signatureName,
          pod_notes: notes,
        },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Delivery confirmed with proof of delivery");
      setSignatureName("");
      setNotes("");
      setPhotoPath(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `${id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("pod-photos").upload(path, file);
      if (error) throw error;
      setPhotoPath(path);
      toast.success("Photo uploaded — submit to attach it to this delivery");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading shipment…</div>;
  if (!data?.shipment) return <EmptyState icon={Package} title="Shipment not found" />;

  const s = data.shipment;
  const driverName = data.drivers.find((d) => d.id === s.driver_id)?.full_name;
  const routeName = data.routes.find((r) => r.id === s.route_id)?.name;

  return (
    <div className="space-y-6">
      <Link
        to="/portal/divisions/logistics/shipments"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Shipments
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{s.customer}</h1>
            <StatusBadge status={s.status} />
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="font-mono">{s.reference}</span>
            <span className="font-mono acc-text">{s.tracking_code}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DataPanel title="Route (map placeholder)">
            {/* No live map provider is wired up — this is a clearly-labelled pin list
                standing in for a real map until Mapbox/Google Maps is connected. */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                <MapPin className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Pickup</div>
                  <div className="text-sm font-medium">{s.pickup_city ?? "—"}</div>
                </div>
              </div>
              <div className="ml-2 h-6 border-l border-dashed border-border" />
              <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                <MapPin className="h-4 w-4 shrink-0 text-gold mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Drop-off</div>
                  <div className="text-sm font-medium">{s.dropoff_city ?? "—"}</div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                A real map (Mapbox/Google Maps) isn't connected in this build — pickup/drop-off
                coordinate fields exist on the schema and are ready to render pins once one is.
              </p>
            </div>
          </DataPanel>

          <DataPanel title="Tracking timeline">
            {data.events.length === 0 ? (
              <EmptyState icon={Clock} title="No events yet" />
            ) : (
              <div className="space-y-4">
                {data.events.map((ev) => (
                  <div key={ev.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <CheckCircle2 className="h-4 w-4 acc-text" />
                      <div className="mt-1 w-px flex-1 bg-border" />
                    </div>
                    <div className="pb-2">
                      <div className="text-sm font-medium capitalize">{ev.status.replace(/_/g, " ")}</div>
                      {ev.note && <div className="text-xs text-muted-foreground">{ev.note}</div>}
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {new Date(ev.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DataPanel>

          {s.status !== "delivered" && s.status !== "failed" && (
            <DataPanel title="Confirm delivery (proof of delivery)">
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  podMut.mutate();
                }}
              >
                <div className="space-y-1.5">
                  <Label className="text-xs">Delivery photo</Label>
                  <Input type="file" accept="image/*" onChange={onPhotoSelected} disabled={uploading} />
                  {photoPath && (
                    <img
                      src={podUrl(photoPath)}
                      alt="Delivery proof"
                      className="mt-2 h-32 w-32 rounded-lg border border-border object-cover"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Recipient signature name</Label>
                  <Input
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="Who signed for it?"
                    maxLength={180}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notes</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
                </div>
                <Button type="submit" disabled={podMut.isPending || uploading}>
                  <FileSignature className="mr-2 h-4 w-4" /> Confirm delivered
                </Button>
              </form>
            </DataPanel>
          )}

          {(s.pod_photo_url || s.pod_signature_name) && (
            <DataPanel title="Proof of delivery">
              <div className="flex flex-wrap items-start gap-4">
                {s.pod_photo_url && (
                  <img
                    src={podUrl(s.pod_photo_url)}
                    alt="Delivery proof"
                    className="h-32 w-32 rounded-lg border border-border object-cover"
                  />
                )}
                <div className="text-sm">
                  {s.pod_signature_name && <div>Signed by {s.pod_signature_name}</div>}
                  {s.pod_notes && <div className="mt-1 text-muted-foreground">{s.pod_notes}</div>}
                  {s.delivered_at && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Delivered {new Date(s.delivered_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </DataPanel>
          )}
        </div>

        <div className="space-y-6">
          <DataPanel title="Shipment details">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cargo</span>
                <span className="text-right">{s.cargo ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Weight</span>
                <span>{Number(s.weight_kg).toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <span className="capitalize">{s.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ETA</span>
                <span>{s.eta ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route</span>
                <span>{routeName ?? "—"}</span>
              </div>
            </div>
          </DataPanel>

          <DataPanel title="Driver">
            <div className="space-y-3">
              {driverName ? (
                <div className="flex items-center gap-2 text-sm">
                  <TruckIcon className="h-4 w-4 acc-text" /> {driverName}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Unassigned</div>
              )}
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  assignMut.mutate();
                }}
              >
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="h-9 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {data.drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" disabled={assignMut.isPending}>
                  Assign
                </Button>
              </form>
            </div>
          </DataPanel>

          <DataPanel title="Update status">
            <div className="flex flex-wrap gap-1.5">
              {SHIPMENT_STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  disabled={st === s.status || statusMut.isPending}
                  onClick={() => statusMut.mutate(st)}
                  className="rounded border border-border px-2 py-1 text-[11px] capitalize text-muted-foreground transition hover:acc-border-soft hover:text-foreground disabled:opacity-40"
                >
                  {st.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </DataPanel>
        </div>
      </div>
    </div>
  );
}
