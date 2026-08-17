import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ImagePlus,
  Trash2,
  Plus,
  Building2,
  Users,
  DoorOpen,
  Star,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  getPropertyDetail,
  updateProperty,
  updatePropertyStatus,
  addUnit,
  updateUnitStatus,
  PROPERTY_STATUSES,
  UNIT_STATUSES,
  AMENITY_OPTIONS,
} from "@/lib/realestate.functions";
import { authHeaders } from "@/lib/auth-headers";
import { supabase } from "@/integrations/supabase/client";
import { DataPanel, EmptyState, StatusBadge, KpiStat } from "@/components/portal/blocks";
import { RecordDocuments } from "@/components/portal/RecordDocuments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, resolveImageUrl } from "@/lib/utils";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/properties/$id")({
  component: PropertyDetailPage,
});

const naira = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
};

function imgUrl(path: string) {
  return resolveImageUrl("property-images", path);
}

function PropertyDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-property", id],
    queryFn: async () => getPropertyDetail({ headers: await authHeaders(), data: { id } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["realestate-property", id] });

  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editAmenities, setEditAmenities] = useState<string[]>([]);
  const [editFeatured, setEditFeatured] = useState(false);

  const [unitNumber, setUnitNumber] = useState("");
  const [unitRent, setUnitRent] = useState("");

  function startEditing() {
    if (!data) return;
    setEditDescription(data.property.description ?? "");
    setEditPrice(String(data.property.price ?? 0));
    setEditAmenities(
      Array.isArray(data.property.amenities) ? (data.property.amenities as string[]) : [],
    );
    setEditFeatured(Boolean(data.property.featured));
    setEditing(true);
  }

  const saveMut = useMutation({
    mutationFn: async () =>
      updateProperty({
        data: {
          id,
          description: editDescription,
          price: Number(editPrice) || 0,
          amenities: editAmenities,
          featured: editFeatured,
        },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Property updated");
      setEditing(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: async (status: (typeof PROPERTY_STATUSES)[number]) =>
      updatePropertyStatus({ data: { id, status }, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const addUnitMut = useMutation({
    mutationFn: async () =>
      addUnit({
        data: { property_id: id, unit_number: unitNumber, rent_amount: Number(unitRent) || 0 },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Unit added");
      setUnitNumber("");
      setUnitRent("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unitStatusMut = useMutation({
    mutationFn: async (v: { unitId: string; status: (typeof UNIT_STATUSES)[number] }) =>
      updateUnitStatus({ data: { id: v.unitId, status: v.status }, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  async function onUploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const userId = sess.session?.user.id ?? null;
      const startPos = data?.images.length ?? 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${id}/${Date.now()}-${i}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("property-images").upload(path, file);
        if (upErr) throw upErr;
        const { error: dbErr } = await supabase.from("property_images").insert({
          property_id: id,
          storage_path: path,
          position: startPos + i,
          uploaded_by: userId,
        });
        if (dbErr) throw dbErr;
      }
      toast.success("Photo(s) uploaded");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onRemovePhoto(imageId: string, path: string) {
    await supabase.storage.from("property-images").remove([path]);
    await supabase.from("property_images").delete().eq("id", imageId);
    invalidate();
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading property…</div>;
  if (!data) return <EmptyState icon={Building2} title="Property not found" />;

  const { property, images, units, leads, analytics } = data;

  return (
    <div className="space-y-8">
      <Link
        to="/portal/divisions/real-estate/properties"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Properties
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{property.title}</h1>
            {property.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 text-gold px-2 py-0.5 text-[10px] font-semibold">
                <Star className="h-3 w-3 fill-current" /> Featured
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {property.property_type.replace(/_/g, " ")} · {property.city || "—"} ·{" "}
            {property.address || "no address on file"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => statusMut.mutate(s)}
              className={cn(
                "rounded border px-2 py-1 text-[11px] capitalize transition",
                s === property.status
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery */}
      <DataPanel
        title="Photo gallery"
        action={
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-gold text-gold-foreground hover:bg-gold/90 px-3 py-1.5 text-xs font-medium">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onUploadPhoto}
              disabled={uploading}
            />
            <ImagePlus className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Add photos"}
          </label>
        }
      >
        {images.length === 0 ? (
          <EmptyState icon={ImagePlus} title="No photos yet" description="Add the first one above." />
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border"
              >
                <img src={imgUrl(img.storage_path)} alt={img.caption ?? ""} className="h-full w-full object-cover" />
                <button
                  onClick={() => onRemovePhoto(img.id, img.storage_path)}
                  className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </DataPanel>

      {/* Analytics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={Building2} label="Listing price" value={naira(Number(property.price))} />
        <KpiStat
          icon={DoorOpen}
          label="Units"
          value={analytics.totalUnits}
          hint={
            analytics.occupancyRate !== null ? `${analytics.occupancyRate}% occupied` : undefined
          }
        />
        <KpiStat
          icon={Users}
          label="Tenants on file"
          value={data.tenants.length}
        />
        <KpiStat
          icon={Building2}
          label="Unit revenue / mo"
          value={naira(analytics.unitMonthlyRevenue)}
        />
      </div>

      {/* Details / edit */}
      <DataPanel
        title="Details"
        action={
          editing ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
                <Check className="mr-1 h-3.5 w-3.5" /> Save
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={startEditing}>
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
            </Button>
          )
        }
      >
        {editing ? (
          <div className="space-y-4">
            <Textarea
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
            <div className="max-w-[200px]">
              <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() =>
                    setEditAmenities((prev) =>
                      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
                    )
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs capitalize transition",
                    editAmenities.includes(a)
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {a.replace(/_/g, " ")}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editFeatured}
                onChange={(e) => setEditFeatured(e.target.checked)}
              />
              Featured
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {property.description || "No description yet."}
            </p>
            {Array.isArray(property.amenities) && property.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(property.amenities as string[]).map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-surface-elevated border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground capitalize"
                  >
                    {a.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </DataPanel>

      {/* Units */}
      <DataPanel title="Units">
        <form
          className="flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (unitNumber.trim()) addUnitMut.mutate();
          }}
        >
          <Input
            className="max-w-[140px]"
            placeholder="Unit no."
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
          />
          <Input
            type="number"
            className="max-w-[160px]"
            placeholder="Rent (₦/yr)"
            value={unitRent}
            onChange={(e) => setUnitRent(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={!unitNumber.trim() || addUnitMut.isPending}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add unit
          </Button>
        </form>

        {units.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={DoorOpen} title="No units yet" description="Add units to track occupancy per-floor." />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((u) => (
              <div key={u.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between">
                  <Link
                    to="/portal/divisions/real-estate/units/$id"
                    params={{ id: u.id }}
                    className="font-medium text-sm hover:acc-text hover:underline"
                  >
                    Unit {u.unit_number}
                  </Link>
                  <StatusBadge status={u.status} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {naira(Number(u.rent_amount))}/yr
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {UNIT_STATUSES.filter((s) => s !== u.status).map((s) => (
                    <button
                      key={s}
                      onClick={() => unitStatusMut.mutate({ unitId: u.id, status: s })}
                      className="rounded border border-border px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DataPanel>

      {/* Linked leads */}
      <DataPanel title="Leads interested in this property">
        {leads.length === 0 ? (
          <EmptyState icon={Users} title="No leads yet" />
        ) : (
          <div className="divide-y divide-border">
            {leads.map((l) => (
              <div key={l.id} className="py-2.5 flex items-center justify-between text-sm">
                <span>{l.full_name}</span>
                <StatusBadge status={l.stage} />
              </div>
            ))}
          </div>
        )}
      </DataPanel>
      <RecordDocuments recordTable="properties" recordId={id} division="real-estate" title="Property documents" />
    </div>
  );
}
