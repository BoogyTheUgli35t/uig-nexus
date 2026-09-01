import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Building2, Save } from "lucide-react";
import {
  AMENITY_OPTIONS,
  getPropertyDetail,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from "@/lib/realestate.functions";
import { updatePropertyFull } from "@/lib/realestate-crud.functions";
import { authHeaders } from "@/lib/auth-headers";
import { EmptyState } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/properties/$id_/edit")({
  component: EditPropertyPage,
});

type FormState = {
  title: string;
  property_type: (typeof PROPERTY_TYPES)[number];
  status: (typeof PROPERTY_STATUSES)[number];
  city: string;
  address: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  area_sqm: string;
  year_built: string;
  description: string;
  amenities: string[];
  featured: boolean;
};

function EditPropertyPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-property", id],
    queryFn: async () => getPropertyDetail({ headers: await authHeaders(), data: { id } }),
  });

  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data?.property || form) return;
    const p = data.property;
    setForm({
      title: p.title ?? "",
      property_type: (p.property_type ?? "residential") as FormState["property_type"],
      status: (p.status ?? "available") as FormState["status"],
      city: p.city ?? "",
      address: p.address ?? "",
      price: String(p.price ?? 0),
      bedrooms: String(p.bedrooms ?? 0),
      bathrooms: String(p.bathrooms ?? 0),
      area_sqm: String(p.area_sqm ?? 0),
      year_built: p.year_built ? String(p.year_built) : "",
      description: p.description ?? "",
      amenities: Array.isArray(p.amenities) ? (p.amenities as string[]) : [],
      featured: Boolean(p.featured),
    });
  }, [data, form]);

  const saveMut = useMutation({
    mutationFn: async (values: FormState) =>
      updatePropertyFull({
        headers: await authHeaders(),
        data: {
          id,
          title: values.title,
          property_type: values.property_type,
          status: values.status,
          city: values.city,
          address: values.address,
          price: Number(values.price) || 0,
          bedrooms: Number(values.bedrooms) || 0,
          bathrooms: Number(values.bathrooms) || 0,
          area_sqm: Number(values.area_sqm) || 0,
          year_built: values.year_built ? Number(values.year_built) : null,
          description: values.description,
          amenities: values.amenities,
          featured: values.featured,
        },
      }),
    onSuccess: () => {
      toast.success("Property updated");
      navigate({ to: "/portal/divisions/real-estate/properties/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !form) {
    return <div className="text-sm text-muted-foreground">Loading property…</div>;
  }
  if (!data?.property) return <EmptyState icon={Building2} title="Property not found" />;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function validate(values: FormState) {
    const next: Record<string, string> = {};
    if (!values.title.trim()) next["title"] = "Title is required";
    if (Number(values.price) < 0 || Number.isNaN(Number(values.price)))
      next["price"] = "Enter a valid price";
    if (values.year_built && (Number(values.year_built) < 1900 || Number(values.year_built) > 2100))
      next["year_built"] = "Year must be between 1900 and 2100";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/portal/divisions/real-estate/properties/$id"
        params={{ id }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to property
      </Link>

      <h1 className="text-2xl font-bold">Edit property</h1>

      <form
        className="grid gap-4 rounded-xl border border-border bg-surface p-6 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (form && validate(form)) saveMut.mutate(form);
        }}
        noValidate
      >
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={form.title}
            aria-invalid={!!errors["title"]}
            aria-describedby={errors["title"] ? "title-error" : undefined}
            onChange={(e) => set("title", e.target.value)}
          />
          {errors["title"] && (
            <p id="title-error" className="text-xs text-destructive">
              {errors["title"]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="property_type">Type</Label>
          <select
            id="property_type"
            value={form.property_type}
            onChange={(e) => set("property_type", e.target.value as FormState["property_type"])}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => set("status", e.target.value as FormState["status"])}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {PROPERTY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="price">Price (₦)</Label>
          <Input
            id="price"
            type="number"
            min={0}
            value={form.price}
            aria-invalid={!!errors["price"]}
            onChange={(e) => set("price", e.target.value)}
          />
          {errors["price"] && <p className="text-xs text-destructive">{errors["price"]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="area">Area (m²)</Label>
          <Input
            id="area"
            type="number"
            min={0}
            value={form.area_sqm}
            onChange={(e) => set("area_sqm", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input
            id="bedrooms"
            type="number"
            min={0}
            value={form.bedrooms}
            onChange={(e) => set("bedrooms", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input
            id="bathrooms"
            type="number"
            min={0}
            value={form.bathrooms}
            onChange={(e) => set("bathrooms", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="year_built">Year built</Label>
          <Input
            id="year_built"
            type="number"
            value={form.year_built}
            aria-invalid={!!errors["year_built"]}
            onChange={(e) => set("year_built", e.target.value)}
          />
          {errors["year_built"] && (
            <p className="text-xs text-destructive">{errors["year_built"]}</p>
          )}
        </div>

        <div className="flex items-end gap-2">
          <input
            id="featured"
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set("featured", e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="featured">Featured listing</Label>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-medium">Amenities</legend>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => {
              const checked = form!.amenities.includes(a);
              return (
                <label
                  key={a}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-xs capitalize transition ${
                    checked
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() =>
                      set(
                        "amenities",
                        checked ? form!.amenities.filter((x) => x !== a) : [...form!.amenities, a],
                      )
                    }
                  />
                  {a.replace(/_/g, " ")}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              navigate({ to: "/portal/divisions/real-estate/properties/$id", params: { id } })
            }
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saveMut.isPending}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            <Save className="mr-2 h-4 w-4" /> {saveMut.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
