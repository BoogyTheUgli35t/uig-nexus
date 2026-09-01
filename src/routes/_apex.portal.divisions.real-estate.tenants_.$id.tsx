import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save, Users } from "lucide-react";
import { getTenantDetail, updateTenant } from "@/lib/realestate-crud.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { RecordDocuments } from "@/components/portal/RecordDocuments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/tenants_/$id")({
  component: TenantDetailPage,
});

const PAYMENT_STATUSES = ["current", "due", "overdue"] as const;

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  property_id: string;
  rent_amount: string;
  lease_start: string;
  lease_end: string;
  payment_status: (typeof PAYMENT_STATUSES)[number];
};

function TenantDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-tenant", id],
    queryFn: async () => getTenantDetail({ headers: await authHeaders(), data: { id } }),
  });

  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data?.tenant || form) return;
    const t = data.tenant;
    setForm({
      full_name: t.full_name ?? "",
      email: t.email ?? "",
      phone: t.phone ?? "",
      property_id: t.property_id ?? "",
      rent_amount: String(t.rent_amount ?? 0),
      lease_start: t.lease_start ?? "",
      lease_end: t.lease_end ?? "",
      payment_status: (t.payment_status ?? "current") as FormState["payment_status"],
    });
  }, [data, form]);

  const saveMut = useMutation({
    mutationFn: async (values: FormState) =>
      updateTenant({
        headers: await authHeaders(),
        data: {
          id,
          full_name: values.full_name,
          email: values.email,
          phone: values.phone,
          property_id: values.property_id || null,
          rent_amount: Number(values.rent_amount) || 0,
          lease_start: values.lease_start,
          lease_end: values.lease_end,
          payment_status: values.payment_status,
        },
      }),
    onSuccess: () => {
      toast.success("Tenant updated");
      qc.invalidateQueries({ queryKey: ["realestate-tenant", id] });
      qc.invalidateQueries({ queryKey: ["realestate-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !form)
    return <div className="text-sm text-muted-foreground">Loading tenant…</div>;
  if (!data?.tenant) return <EmptyState icon={Users} title="Tenant not found" />;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function validate(values: FormState) {
    const next: Record<string, string> = {};
    if (!values.full_name.trim()) next["full_name"] = "Name is required";
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      next["email"] = "Enter a valid email";
    if (values.lease_start && values.lease_end && values.lease_end < values.lease_start)
      next["lease_end"] = "Lease end must be after the start date";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate({ to: "/portal/divisions/real-estate/tenants" })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All tenants
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{data.tenant.full_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.property ? (
              <Link
                to="/portal/divisions/real-estate/properties/$id"
                params={{ id: data.property.id }}
                className="hover:underline"
              >
                {data.property.title}
              </Link>
            ) : (
              "No property assigned"
            )}
            {data.unit ? ` · Unit ${data.unit.unit_number}` : ""}
          </p>
        </div>
        <StatusBadge status={data.tenant.payment_status} />
      </div>

      <DataPanel title="Tenant details">
        <form
          className="grid gap-4 sm:grid-cols-2"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (form && validate(form)) saveMut.mutate(form);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={form.full_name}
              aria-invalid={!!errors["full_name"]}
              onChange={(e) => set("full_name", e.target.value)}
            />
            {errors["full_name"] && (
              <p className="text-xs text-destructive">{errors["full_name"]}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              aria-invalid={!!errors["email"]}
              onChange={(e) => set("email", e.target.value)}
            />
            {errors["email"] && <p className="text-xs text-destructive">{errors["email"]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="property">Property</Label>
            <select
              id="property"
              value={form.property_id}
              onChange={(e) => set("property_id", e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Unassigned</option>
              {data.properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rent">Rent (₦/yr)</Label>
            <Input
              id="rent"
              type="number"
              min={0}
              value={form.rent_amount}
              onChange={(e) => set("rent_amount", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payment_status">Payment status</Label>
            <select
              id="payment_status"
              value={form.payment_status}
              onChange={(e) => set("payment_status", e.target.value as FormState["payment_status"])}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lease_start">Lease start</Label>
            <Input
              id="lease_start"
              type="date"
              value={form.lease_start}
              onChange={(e) => set("lease_start", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lease_end">Lease end</Label>
            <Input
              id="lease_end"
              type="date"
              value={form.lease_end}
              aria-invalid={!!errors["lease_end"]}
              onChange={(e) => set("lease_end", e.target.value)}
            />
            {errors["lease_end"] && (
              <p className="text-xs text-destructive">{errors["lease_end"]}</p>
            )}
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button
              type="submit"
              disabled={saveMut.isPending}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              <Save className="mr-2 h-4 w-4" /> {saveMut.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DataPanel>

      <RecordDocuments
        recordTable="tenants"
        recordId={id}
        division="real-estate"
        title="Tenant documents"
      />
    </div>
  );
}
