import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Search, FileSignature, Mail, Phone, Send, CheckCircle2, XCircle, Upload } from "lucide-react";
import {
  getRealEstateWorkspace,
  updateTenantPaymentStatus,
  attachLeaseDocument,
  sendLeaseForSignature,
  recordLeaseSignature,
  voidLease,
} from "@/lib/realestate.functions";
import { authHeaders } from "@/lib/auth-headers";
import { supabase } from "@/integrations/supabase/client";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/tenants")({
  component: TenantsPage,
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

const LEASE_BADGE: Record<string, string> = {
  draft: "planning",
  sent: "pending",
  signed: "active",
  void: "error",
};

function TenantsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-workspace"],
    queryFn: async () => getRealEstateWorkspace({ headers: await authHeaders() }),
  });

  const propertyTitle = useMemo(() => {
    const m = new Map<string, string>();
    (data?.properties ?? []).forEach((p) => m.set(p.id, p.title));
    return m;
  }, [data]);

  const tenants = (data?.tenants ?? []).filter((t) =>
    t.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  const [signingId, setSigningId] = useState<string | null>(null);
  const [signedName, setSignedName] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["realestate-workspace"] });

  const paymentMut = useMutation({
    mutationFn: async (v: { id: string; payment_status: "current" | "due" | "overdue" }) =>
      updateTenantPaymentStatus({ data: v, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMut = useMutation({
    mutationFn: async (id: string) => sendLeaseForSignature({ data: { id }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Lease sent for signature");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signMut = useMutation({
    mutationFn: async (v: { id: string; signed_name: string }) =>
      recordLeaseSignature({ data: v, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Signature recorded");
      setSigningId(null);
      setSignedName("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const voidMut = useMutation({
    mutationFn: async (id: string) => voidLease({ data: { id }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Lease voided");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onUploadLease(tenantId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(tenantId);
    try {
      const path = `${tenantId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("lease-documents").upload(path, file);
      if (upErr) throw upErr;
      await attachLeaseDocument({ data: { id: tenantId, file_path: path }, headers: await authHeaders() });
      toast.success("Lease document attached");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingId(null);
      e.target.value = "";
    }
  }

  async function onDownloadLease(path: string) {
    const { data, error } = await supabase.storage.from("lease-documents").createSignedUrl(path, 60);
    if (error || !data) {
      toast.error(error?.message ?? "Couldn't generate download link");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Tenant portal</h2>
          <p className="text-sm text-muted-foreground">
            {tenants.length} tenant{tenants.length === 1 ? "" : "s"} on file.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search tenants…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataPanel title="Leases">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : tenants.length === 0 ? (
          <EmptyState icon={Users} title="No tenants found" />
        ) : (
          <div className="divide-y divide-border">
            {tenants.map((t) => (
              <div key={t.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to="/portal/divisions/real-estate/tenants/$id" params={{ id: t.id }} className="font-medium hover:underline">{t.full_name}</Link>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {t.property_id ? (propertyTitle.get(t.property_id) ?? "—") : "—"}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {t.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {t.email}
                        </span>
                      )}
                      {t.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {t.phone}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Lease: {t.lease_start ?? "—"} → {t.lease_end ?? "—"}
                    </div>
                  </div>
                  <div className="shrink-0 text-right space-y-2">
                    <div className="text-sm font-medium">{naira(Number(t.rent_amount))}/yr</div>
                    <StatusBadge status={PAYMENT_BADGE[t.payment_status] ?? t.payment_status} />
                    <div className="flex flex-wrap justify-end gap-1">
                      {(["current", "due", "overdue"] as const)
                        .filter((s) => s !== t.payment_status)
                        .map((s) => (
                          <button
                            key={s}
                            onClick={() => paymentMut.mutate({ id: t.id, payment_status: s })}
                            className="rounded border border-border px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground hover:text-foreground"
                          >
                            {s}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <StatusBadge status={LEASE_BADGE[t.lease_signature_status] ?? t.lease_signature_status} />
                  <span className="text-xs capitalize text-muted-foreground">
                    Lease: {t.lease_signature_status}
                    {t.lease_signature_status === "sent" && t.lease_sent_at
                      ? ` · sent ${new Date(t.lease_sent_at).toLocaleDateString()}`
                      : ""}
                    {t.lease_signature_status === "signed" && t.lease_signed_at
                      ? ` by ${t.lease_signed_name} on ${new Date(t.lease_signed_at).toLocaleDateString()}`
                      : ""}
                  </span>

                  <div className="ml-auto flex flex-wrap items-center gap-1.5">
                    {t.lease_document_path ? (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => onDownloadLease(t.lease_document_path!)}>
                        <FileSignature className="mr-1.5 h-3.5 w-3.5" /> View lease
                      </Button>
                    ) : (
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                        <Upload className="h-3.5 w-3.5" />
                        {uploadingId === t.id ? "Uploading…" : "Attach lease"}
                        <input
                          type="file"
                          className="hidden"
                          disabled={uploadingId === t.id}
                          onChange={(e) => onUploadLease(t.id, e)}
                        />
                      </label>
                    )}

                    {t.lease_signature_status === "draft" && (
                      <Button size="sm" variant="outline" className="text-xs" disabled={sendMut.isPending} onClick={() => sendMut.mutate(t.id)}>
                        <Send className="mr-1.5 h-3.5 w-3.5" /> Send for signature
                      </Button>
                    )}

                    {t.lease_signature_status === "sent" && signingId !== t.id && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => setSigningId(t.id)}>
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Record signature
                      </Button>
                    )}

                    {t.lease_signature_status === "sent" && signingId === t.id && (
                      <div className="flex items-center gap-1.5">
                        <Input
                          autoFocus
                          value={signedName}
                          onChange={(e) => setSignedName(e.target.value)}
                          placeholder="Typed full name"
                          className="h-8 w-40 text-xs"
                        />
                        <Button
                          size="sm"
                          disabled={!signedName.trim() || signMut.isPending}
                          onClick={() => signMut.mutate({ id: t.id, signed_name: signedName.trim() })}
                        >
                          Confirm
                        </Button>
                      </div>
                    )}

                    {(t.lease_signature_status === "sent" || t.lease_signature_status === "draft") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-destructive hover:bg-destructive/10"
                        disabled={voidMut.isPending}
                        onClick={() => voidMut.mutate(t.id)}
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" /> Void
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
