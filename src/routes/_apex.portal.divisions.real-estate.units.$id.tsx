import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, DoorOpen, UserPlus, Mail, Phone, Pencil } from "lucide-react";
import {
  getUnitDetail,
  createTenant,
  assignTenantToUnit,
  updateUnitStatus,
  updateTenantPaymentStatus,
  UNIT_STATUSES,
} from "@/lib/realestate.functions";
import { updateUnit } from "@/lib/realestate-crud.functions";
import { authHeaders } from "@/lib/auth-headers";
import {
  DataPanel,
  EmptyState,
  KpiStat,
  QueryError,
  StatusBadge,
} from "@/components/portal/blocks";
import { RecordDocuments } from "@/components/portal/RecordDocuments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/units/$id")({
  component: UnitDetailPage,
});

const naira = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
};

const PAYMENT_BADGE: Record<string, string> = {
  current: "active",
  due: "planning",
  overdue: "error",
};

function UnitDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["realestate-unit", id],
    queryFn: async () => getUnitDetail({ headers: await authHeaders(), data: { id } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["realestate-unit", id] });

  const [showNewTenant, setShowNewTenant] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rent, setRent] = useState("");
  const [leaseStart, setLeaseStart] = useState("");
  const [leaseEnd, setLeaseEnd] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [editing, setEditing] = useState(false);

  const onEdited = () => {
    setEditing(false);
    invalidate();
    // The units list and the property's unit roll-up both read these rows.
    qc.invalidateQueries({ queryKey: ["realestate-units"] });
    qc.invalidateQueries({ queryKey: ["realestate-workspace"] });
  };

  const statusMut = useMutation({
    mutationFn: async (status: (typeof UNIT_STATUSES)[number]) =>
      updateUnitStatus({ data: { id, status }, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const createTenantMut = useMutation({
    mutationFn: async () =>
      createTenant({
        data: {
          property_id: data!.unit.property_id,
          unit_id: id,
          full_name: name,
          email,
          phone,
          rent_amount: Number(rent) || 0,
          lease_start: leaseStart,
          lease_end: leaseEnd,
        },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Tenant added and assigned");
      setShowNewTenant(false);
      setName("");
      setEmail("");
      setPhone("");
      setRent("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignMut = useMutation({
    mutationFn: async () =>
      assignTenantToUnit({
        data: { unit_id: id, tenant_id: selectedTenant },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Tenant assigned");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const paymentMut = useMutation({
    mutationFn: async (payment_status: "current" | "due" | "overdue") =>
      updateTenantPaymentStatus({
        data: { id: data!.tenant!.id, payment_status },
        headers: await authHeaders(),
      }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) return <QueryError error={error} onRetry={() => refetch()} label="this unit" />;
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading unit…</div>;
  if (!data) return <EmptyState icon={DoorOpen} title="Unit not found" />;

  const { unit, property, tenant, unassignedTenants } = data;
  const editable = {
    unit_number: unit.unit_number,
    floor: unit.floor,
    bedrooms: unit.bedrooms,
    bathrooms: unit.bathrooms,
    area_sqm: Number(unit.area_sqm),
    rent_amount: Number(unit.rent_amount),
    status: unit.status as (typeof UNIT_STATUSES)[number],
  };

  return (
    <div className="space-y-8">
      <Link
        to="/portal/divisions/real-estate/properties/$id"
        params={{ id: unit.property_id }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {property?.title ?? "Property"}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Unit {unit.unit_number}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {property?.city || "—"} · {property?.address || "no address"}
          </p>
        </div>
        <StatusBadge status={unit.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiStat label="Rent" value={naira(Number(unit.rent_amount))} hint="per year" />
        <KpiStat label="Bed / Bath" value={`${unit.bedrooms} / ${unit.bathrooms}`} />
        <KpiStat label="Area" value={`${Number(unit.area_sqm)} m²`} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {UNIT_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => statusMut.mutate(s)}
            className={`rounded border px-2.5 py-1 text-xs capitalize transition ${
              s === unit.status
                ? "border-gold bg-gold/10 text-gold"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
        <Button
          size="sm"
          variant="outline"
          className="ml-auto h-7 px-2 text-xs"
          onClick={() => setEditing((v) => !v)}
        >
          <Pencil className="mr-1.5 h-3.5 w-3.5" /> {editing ? "Cancel" : "Edit unit"}
        </Button>
      </div>

      {editing && <UnitEditForm unitId={id} initial={editable} onDone={onEdited} />}

      <DataPanel title="Tenant">
        {tenant ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{tenant.full_name}</div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {tenant.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {tenant.email}
                    </span>
                  )}
                  {tenant.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {tenant.phone}
                    </span>
                  )}
                </div>
              </div>
              <StatusBadge status={PAYMENT_BADGE[tenant.payment_status] ?? tenant.payment_status} />
            </div>
            <div className="text-sm text-muted-foreground">
              Lease: {tenant.lease_start ?? "—"} → {tenant.lease_end ?? "—"} ·{" "}
              {naira(Number(tenant.rent_amount))}/yr
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["current", "due", "overdue"] as const)
                .filter((s) => s !== tenant.payment_status)
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => paymentMut.mutate(s)}
                    className="rounded border border-border px-2 py-1 text-[11px] capitalize text-muted-foreground hover:text-foreground"
                  >
                    Mark {s}
                  </button>
                ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <EmptyState
              icon={UserPlus}
              title="No tenant assigned"
              description="Assign an existing tenant or add a new one."
            />
            {unassignedTenants.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">Select existing tenant…</option>
                  {unassignedTenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  disabled={!selectedTenant || assignMut.isPending}
                  onClick={() => assignMut.mutate()}
                >
                  Assign
                </Button>
              </div>
            )}
            {!showNewTenant ? (
              <Button size="sm" variant="outline" onClick={() => setShowNewTenant(true)}>
                <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Add new tenant
              </Button>
            ) : (
              <form
                className="grid gap-3 sm:grid-cols-2 rounded-lg border border-border p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (name.trim()) createTenantMut.mutate();
                }}
              >
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Full name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Rent (₦/yr)</Label>
                  <Input type="number" value={rent} onChange={(e) => setRent(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Lease start</Label>
                  <Input
                    type="date"
                    value={leaseStart}
                    onChange={(e) => setLeaseStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Lease end</Label>
                  <Input
                    type="date"
                    value={leaseEnd}
                    onChange={(e) => setLeaseEnd(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setShowNewTenant(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!name.trim() || createTenantMut.isPending}>
                    Save tenant
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </DataPanel>
      <RecordDocuments
        recordTable="property_units"
        recordId={id}
        division="real-estate"
        title="Unit documents"
      />
    </div>
  );
}

/**
 * Editing a unit's own details.
 *
 * Properties have had a full editor since the start; units only ever had a
 * status toggle, so a typo in a unit number or a rent increase meant editing
 * the row in Supabase directly. `updateUnit` was written for this and had no
 * caller.
 */
function UnitEditForm({
  unitId,
  initial,
  onDone,
}: {
  unitId: string;
  initial: {
    unit_number: string;
    floor: number | null;
    bedrooms: number;
    bathrooms: number;
    area_sqm: number;
    rent_amount: number;
    status: (typeof UNIT_STATUSES)[number];
  };
  onDone: () => void;
}) {
  const [form, setForm] = useState(initial);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const saveMut = useMutation({
    mutationFn: async () =>
      updateUnit({
        data: {
          id: unitId,
          unit_number: form.unit_number.trim(),
          floor: form.floor,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          area_sqm: form.area_sqm,
          rent_amount: form.rent_amount,
          status: form.status,
        },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Unit updated");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const num = (v: string) => (v === "" ? 0 : Number(v));

  return (
    <form
      className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (form.unit_number.trim()) saveMut.mutate();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="u-number">Unit number</Label>
        <Input
          id="u-number"
          value={form.unit_number}
          onChange={(e) => set("unit_number", e.target.value)}
          maxLength={40}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="u-floor">Floor</Label>
        <Input
          id="u-floor"
          type="number"
          value={form.floor ?? ""}
          onChange={(e) => set("floor", e.target.value === "" ? null : Number(e.target.value))}
          placeholder="—"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="u-status">Status</Label>
        <select
          id="u-status"
          value={form.status}
          onChange={(e) => set("status", e.target.value as (typeof UNIT_STATUSES)[number])}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm capitalize"
        >
          {UNIT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="u-bed">Bedrooms</Label>
        <Input
          id="u-bed"
          type="number"
          min={0}
          value={form.bedrooms}
          onChange={(e) => set("bedrooms", num(e.target.value))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="u-bath">Bathrooms</Label>
        <Input
          id="u-bath"
          type="number"
          min={0}
          value={form.bathrooms}
          onChange={(e) => set("bathrooms", num(e.target.value))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="u-area">Area (m²)</Label>
        <Input
          id="u-area"
          type="number"
          min={0}
          value={form.area_sqm}
          onChange={(e) => set("area_sqm", num(e.target.value))}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="u-rent">Rent (₦ per year)</Label>
        <Input
          id="u-rent"
          type="number"
          min={0}
          value={form.rent_amount}
          onChange={(e) => set("rent_amount", num(e.target.value))}
        />
      </div>
      <div className="flex items-end justify-end sm:col-span-1">
        <Button type="submit" disabled={!form.unit_number.trim() || saveMut.isPending}>
          {saveMut.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
