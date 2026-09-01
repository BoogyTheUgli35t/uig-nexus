import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  MapPinned,
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  Camera,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getFieldDetail,
  addFieldImage,
  removeFieldImage,
  IMAGE_SOURCES,
} from "@/lib/agritech.functions";
import { authHeaders } from "@/lib/auth-headers";
import { supabase } from "@/integrations/supabase/client";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_apex/portal/divisions/agritech/fields/$id")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: FieldDetailPage,
});

function imgUrl(path: string) {
  return supabase.storage.from("field-images").getPublicUrl(path).data.publicUrl;
}

function FieldDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [source, setSource] = useState<(typeof IMAGE_SOURCES)[number]>("manual");

  const { data, isLoading } = useQuery({
    queryKey: ["agri-field", id],
    queryFn: async () => getFieldDetail({ headers: await authHeaders(), data: { id } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["agri-field", id] });

  const removeMut = useMutation({
    mutationFn: async (imageId: string) =>
      removeFieldImage({ data: { id: imageId }, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${id}/${Date.now()}-${i}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("field-images").upload(path, file);
        if (upErr) throw upErr;
        await addFieldImage({
          data: { field_id: id, storage_path: path, source },
          headers: await authHeaders(),
        });
      }
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading field…</div>;
  if (!data?.field) return <EmptyState icon={MapPinned} title="Field not found" />;

  const f = data.field;
  const chartData = data.readings.map((r) => ({
    time: new Date(r.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    moisture: r.soil_moisture,
    temp: r.temperature,
  }));

  return (
    <div className="space-y-6">
      <Link
        to="/portal/divisions/agritech/fields"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Fields
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{f.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.farmer?.full_name ?? "—"} · {f.hectares} ha · {f.crop ?? "—"}
          </p>
        </div>
        <StatusBadge status={f.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DataPanel title="Field location (map placeholder)">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
              <MapPin className="h-5 w-5 text-emerald-400" />
              <div className="text-sm">
                {f.lat != null && f.lng != null
                  ? `${f.lat}, ${f.lng}`
                  : "No coordinates recorded yet"}
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              A real map (with sensor overlay pins) isn't connected in this build — lat/lng fields
              exist on the schema and are ready to render once a map provider is.
            </p>
          </DataPanel>

          <DataPanel title="Sensor history">
            {chartData.length === 0 ? (
              <EmptyState icon={AlertTriangle} title="No sensor readings yet" />
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="moisture"
                      stroke="var(--acc, var(--gold))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="var(--muted-foreground)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </DataPanel>

          <DataPanel title="Drone / field image gallery">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as (typeof IMAGE_SOURCES)[number])}
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                {IMAGE_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={onUpload}
                disabled={uploading}
                className="max-w-xs"
              />
              {uploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
            </div>

            {data.images.length === 0 ? (
              <div className="mt-4">
                <EmptyState icon={ImageIcon} title="No images yet" />
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {data.images.map((img) => (
                  <div
                    key={img.id}
                    className="group relative overflow-hidden rounded-lg border border-border"
                  >
                    <img
                      src={imgUrl(img.storage_path)}
                      alt={img.caption ?? ""}
                      className="h-28 w-full object-cover"
                    />
                    <div className="absolute left-1.5 top-1.5 rounded bg-background/80 px-1.5 py-0.5 text-[10px] capitalize">
                      {img.source === "drone" ? (
                        <Camera className="mr-0.5 inline h-2.5 w-2.5" />
                      ) : null}
                      {img.source}
                    </div>
                    <button
                      onClick={() => removeMut.mutate(img.id)}
                      className="absolute right-1.5 top-1.5 rounded bg-background/80 p-1 opacity-0 transition group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </DataPanel>
        </div>

        <div className="space-y-6">
          <DataPanel title="Alerts">
            {data.alerts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No alerts for this field.</p>
            ) : (
              <div className="space-y-2">
                {data.alerts.map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-lg border px-3 py-2 text-xs ${
                      a.acknowledged
                        ? "border-border bg-background text-muted-foreground"
                        : "border-destructive/30 bg-destructive/5"
                    }`}
                  >
                    {a.message}
                  </div>
                ))}
              </div>
            )}
          </DataPanel>
        </div>
      </div>
    </div>
  );
}
