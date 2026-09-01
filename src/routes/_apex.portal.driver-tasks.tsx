import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Truck, MapPin, PackageCheck, Camera, FileSignature, Zap } from "lucide-react";
import {
  getMyDriverProfile,
  getMyDriverTasks,
  updateMyDriverStatus,
  completeDeliveryWithPod,
  updateShipmentStatus,
  DRIVER_STATUSES,
  SHIPMENT_STATUSES,
} from "@/lib/logistics.functions";
import { authHeaders } from "@/lib/auth-headers";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_apex/portal/driver-tasks")({
  head: () => ({
    meta: [{ title: "My deliveries — UIG Logistics" }, { name: "robots", content: "noindex" }],
  }),
  component: DriverTasksPage,
});

/**
 * Mobile-friendly task view for drivers: today's assigned shipments, one-tap status
 * advances, and a proof-of-delivery capture (photo + signature name) right on the card.
 * Only usable once an admin has linked the driver's record to their login on the
 * Logistics → Drivers tab.
 */
function DriverTasksPage() {
  const qc = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-driver-profile"],
    queryFn: async () => getMyDriverProfile({ headers: await authHeaders() }),
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["my-driver-tasks"],
    queryFn: async () => getMyDriverTasks({ headers: await authHeaders() }),
    enabled: Boolean(profile),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["my-driver-tasks"] });
    qc.invalidateQueries({ queryKey: ["my-driver-profile"] });
  };

  const statusMut = useMutation({
    mutationFn: async (status: (typeof DRIVER_STATUSES)[number]) =>
      updateMyDriverStatus({ data: { status }, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const advanceMut = useMutation({
    mutationFn: async (v: { id: string; status: (typeof SHIPMENT_STATUSES)[number] }) =>
      updateShipmentStatus({ data: v, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  if (profileLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  if (!profile) {
    return (
      <div className="max-w-lg">
        <EmptyState
          icon={Truck}
          title="No driver profile linked"
          description="Ask a Logistics admin to link your login to a driver record on the Drivers tab. Once linked, your assigned deliveries will show up here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{profile.full_name}</h1>
            <p className="text-sm text-muted-foreground">
              {profile.deliveries_completed.toLocaleString()} deliveries completed ·{" "}
              {Number(profile.rating).toFixed(1)}★
            </p>
          </div>
          <div className="flex gap-1.5">
            {DRIVER_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                disabled={s === profile.status || statusMut.isPending}
                onClick={() => statusMut.mutate(s)}
                className="rounded border border-border px-2 py-1 text-[11px] capitalize text-muted-foreground transition hover:acc-border-soft hover:text-foreground disabled:opacity-40"
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">My deliveries</h2>
        <p className="text-sm text-muted-foreground">Today's assigned shipments, in order.</p>
      </div>

      {tasksLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (tasks?.shipments.length ?? 0) === 0 ? (
        <EmptyState icon={PackageCheck} title="No deliveries assigned right now" />
      ) : (
        <div className="space-y-3">
          {(tasks?.shipments ?? []).map((s) => (
            <DeliveryCard
              key={s.id}
              shipment={s}
              onAdvance={(status) => advanceMut.mutate({ id: s.id, status })}
              advancing={advanceMut.isPending}
              onDelivered={invalidate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function podUrl(path: string) {
  return supabase.storage.from("pod-photos").getPublicUrl(path).data.publicUrl;
}

function DeliveryCard({
  shipment: s,
  onAdvance,
  advancing,
  onDelivered,
}: {
  shipment: {
    id: string;
    reference: string;
    customer: string;
    pickup_city: string | null;
    dropoff_city: string | null;
    cargo: string | null;
    weight_kg: number;
    status: string;
    priority: string;
    eta: string | null;
    tracking_code: string | null;
  };
  onAdvance: (status: (typeof SHIPMENT_STATUSES)[number]) => void;
  advancing: boolean;
  onDelivered: () => void;
}) {
  const [showPod, setShowPod] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoPath, setPhotoPath] = useState<string | null>(null);

  const podMut = useMutation({
    mutationFn: async () =>
      completeDeliveryWithPod({
        data: { id: s.id, pod_photo_url: photoPath ?? "", pod_signature_name: signatureName },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Delivered");
      setShowPod(false);
      onDelivered();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `${s.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("pod-photos").upload(path, file);
      if (error) throw error;
      setPhotoPath(path);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const idx = SHIPMENT_STATUSES.indexOf(s.status as (typeof SHIPMENT_STATUSES)[number]);
  const next = idx >= 0 && idx < SHIPMENT_STATUSES.length - 2 ? SHIPMENT_STATUSES[idx + 1] : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">{s.customer}</div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {s.pickup_city ?? "—"} → {s.dropoff_city ?? "—"}
          </div>
        </div>
        <StatusBadge status={s.status} />
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span className="font-mono">{s.reference}</span>
        {s.priority !== "standard" && (
          <span className="inline-flex items-center gap-0.5 capitalize text-gold">
            <Zap className="h-3 w-3" /> {s.priority}
          </span>
        )}
        {s.eta && <span>ETA {s.eta}</span>}
      </div>

      {!showPod ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {next && (
            <Button
              size="sm"
              variant="outline"
              disabled={advancing}
              onClick={() => onAdvance(next)}
            >
              Move to {next.replace(/_/g, " ")}
            </Button>
          )}
          {(s.status === "out_for_delivery" || s.status === "in_transit") && (
            <Button size="sm" onClick={() => setShowPod(true)}>
              <FileSignature className="mr-1.5 h-3.5 w-3.5" /> Confirm delivered
            </Button>
          )}
        </div>
      ) : (
        <form
          className="mt-3 space-y-2 border-t border-border pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            podMut.mutate();
          }}
        >
          <Input type="file" accept="image/*" onChange={onPhotoSelected} disabled={uploading} />
          {photoPath && (
            <img
              src={podUrl(photoPath)}
              alt=""
              className="h-20 w-20 rounded-lg border border-border object-cover"
            />
          )}
          <Input
            placeholder="Recipient signature name"
            value={signatureName}
            onChange={(e) => setSignatureName(e.target.value)}
            maxLength={180}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={podMut.isPending || uploading}>
              <Camera className="mr-1.5 h-3.5 w-3.5" /> Submit
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowPod(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
