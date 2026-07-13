import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Trash2, Loader2 } from "lucide-react";
import { createProperty, PROPERTY_TYPES, AMENITY_OPTIONS } from "@/lib/realestate.functions";
import { authHeaders } from "@/lib/auth-headers";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/properties/new")({
  head: () => ({
    meta: [{ title: "List a property — UIG Real Estate" }, { name: "robots", content: "noindex" }],
  }),
  component: NewPropertyWizard,
});

const STEPS = ["Basics", "Details & amenities", "Photos"] as const;

type Basics = {
  title: string;
  property_type: (typeof PROPERTY_TYPES)[number];
  city: string;
  address: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  area_sqm: string;
};

function NewPropertyWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [basics, setBasics] = useState<Basics>({
    title: "",
    property_type: "residential",
    city: "",
    address: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    area_sqm: "",
  });
  const [description, setDescription] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);

  const [uploadedImages, setUploadedImages] = useState<{ path: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  function toggleAmenity(a: string) {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  const basicsValid = basics.title.trim().length > 0;

  async function onCreateProperty() {
    setCreating(true);
    try {
      const { id } = await createProperty({
        data: {
          title: basics.title,
          property_type: basics.property_type,
          city: basics.city || undefined,
          address: basics.address || undefined,
          price: Number(basics.price) || 0,
          bedrooms: Number(basics.bedrooms) || 0,
          bathrooms: Number(basics.bathrooms) || 0,
          area_sqm: Number(basics.area_sqm) || 0,
          description: description || undefined,
          year_built: yearBuilt ? Number(yearBuilt) : undefined,
          amenities,
          featured,
        },
        headers: await authHeaders(),
      });
      setPropertyId(id);
      toast.success("Property created — now add some photos.");
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create property");
    } finally {
      setCreating(false);
    }
  }

  async function onUploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !propertyId) return;
    setUploading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const userId = sess.session?.user.id ?? null;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${propertyId}/${Date.now()}-${i}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("property-images")
          .upload(path, file);
        if (upErr) throw upErr;
        const { error: dbErr } = await supabase.from("property_images").insert({
          property_id: propertyId,
          storage_path: path,
          position: uploadedImages.length + i,
          uploaded_by: userId,
        });
        if (dbErr) throw dbErr;
        setUploadedImages((prev) => [...prev, { path, name: file.name }]);
      }
      toast.success("Photo(s) uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onRemovePhoto(path: string) {
    await supabase.storage.from("property-images").remove([path]);
    await supabase.from("property_images").delete().eq("storage_path", path);
    setUploadedImages((prev) => prev.filter((p) => p.path !== path));
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link
        to="/portal/divisions/real-estate/properties"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Properties
      </Link>

      <div>
        <h1 className="text-2xl font-bold">List a new property</h1>
        <div className="mt-4 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium",
                  i < step
                    ? "border-gold bg-gold text-gold-foreground"
                    : i === step
                      ? "border-gold text-gold"
                      : "border-border text-muted-foreground",
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs",
                  i === step ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {s}
              </span>
              {i < STEPS.length - 1 && <div className="h-px w-8 bg-border" />}
            </div>
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g., Lekki Phase 1 Smart Villa"
                value={basics.title}
                onChange={(e) => setBasics({ ...basics, title: e.target.value })}
                maxLength={180}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Property type</Label>
              <select
                value={basics.property_type}
                onChange={(e) =>
                  setBasics({
                    ...basics,
                    property_type: e.target.value as (typeof PROPERTY_TYPES)[number],
                  })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={basics.city} onChange={(e) => setBasics({ ...basics, city: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Input
                value={basics.address}
                onChange={(e) => setBasics({ ...basics, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Price (₦)</Label>
              <Input
                type="number"
                min={0}
                value={basics.price}
                onChange={(e) => setBasics({ ...basics, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Area (m²)</Label>
              <Input
                type="number"
                min={0}
                value={basics.area_sqm}
                onChange={(e) => setBasics({ ...basics, area_sqm: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Bedrooms</Label>
              <Input
                type="number"
                min={0}
                value={basics.bedrooms}
                onChange={(e) => setBasics({ ...basics, bedrooms: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Bathrooms</Label>
              <Input
                type="number"
                min={0}
                value={basics.bathrooms}
                onChange={(e) => setBasics({ ...basics, bathrooms: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              disabled={!basicsValid}
              onClick={() => setStep(1)}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="rounded-xl border border-border bg-surface p-6 space-y-5">
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the property, its standout features and condition…"
            />
          </div>
          <div className="space-y-2">
            <Label>Year built</Label>
            <Input
              type="number"
              min={1900}
              max={2100}
              className="max-w-[160px]"
              value={yearBuilt}
              onChange={(e) => setYearBuilt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs capitalize transition",
                    amenities.includes(a)
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {a.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="accent-[hsl(var(--gold))]"
            />
            <span className="text-sm">Feature this property on the overview page</span>
          </label>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              disabled={creating}
              onClick={onCreateProperty}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {creating ? "Creating…" : "Create property & continue"}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && propertyId && (
        <div className="rounded-xl border border-border bg-surface p-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            Add photos now, or skip and add them later from the property page.
          </p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-gold text-gold-foreground hover:bg-gold/90 px-4 py-2 text-sm font-medium">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onUploadPhoto}
              disabled={uploading}
            />
            <ImagePlus className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload photos"}
          </label>

          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {uploadedImages.map((img) => (
                <div key={img.path} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                  <img
                    src={supabase.storage.from("property-images").getPublicUrl(img.path).data.publicUrl}
                    alt={img.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => onRemovePhoto(img.path)}
                    className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 transition group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() =>
                navigate({
                  to: "/portal/divisions/real-estate/properties/$id",
                  params: { id: propertyId },
                })
              }
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              <Check className="mr-2 h-4 w-4" /> Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
