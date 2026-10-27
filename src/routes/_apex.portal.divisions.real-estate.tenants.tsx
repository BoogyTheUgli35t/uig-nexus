import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Search,
  FileSignature,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  XCircle,
  Upload,
  X,
} from "lucide-react";
import {
  updateTenantPaymentStatus,
  attachLeaseDocument,
  sendLeaseForSignature,
  recordLeaseSignature,
  voidLease,
} from "@/lib/realestate.functions";
import { listTenantsPaged, TENANT_SORTS } from "@/lib/realestate-crud.functions";
import { authHeaders } from "@/lib/auth-headers";
import { supabase } from "@/integrations/supabase/client";
import { DataPanel, EmptyState, QueryError, StatusBadge } from "@/components/portal/blocks";
import { Pagination } from "@/components/portal/Pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const PAYMENT_FILTERS = ["current", "due", "overdue"] as const;

const SORT_LABEL: Record<(typeof TENANT_SORTS)[number], string> = {
  full_name: "Name",
  rent_amount: "Rent",
  lease_end: "Lease end",
  created_at: "Newest",
};

function TenantsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"" | (typeof PAYMENT_FILTERS)[number]>("");
  const [sortBy, setSortBy] = useState<(typeof TENANT_SORTS)[number]>("full_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Server-side search/filter/sort/page. The page used to pull the entire
  // real-estate workspace and filter names in the browser, so searching for a
  // tenant by email found nothing and every tenant in the portfolio was
  // rendered at once.
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["realestate-tenants", search, paymentStatus, sortBy, sortDir, page],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      listTenantsPaged({
        headers: await authHeaders(),
        data: {
          search: search || undefined,
          paymentStatus: paymentStatus || undefined,
          sortBy,
          sortDir,
          page,
          pageSize,
        },
      }),
  });

  const tenants = data?.rows ?? [];
  const filtered = Boolean(search || paymentStatus);

  const [signingId, setSigningId] = useState<string | null>(null);
  const [signedName, setSignedName] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["realestate-tenants"] });
    // The workspace payload drives the division overview's tenant counts.
    qc.invalidateQueries({ queryKey: ["realestate-workspace"] });
  };

  const paymentMut = useMutation({
    mutationFn: async (v: { id: string; payment_status: "current" | "due" | "overdue" }) =>
      updateTenantPaymentStatus({ data: v, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMut = useMutation({
    mutationFn: async (id: string) =>
      sendLeaseForSignature({ data: { id }, headers: await authHeaders() }),
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
      await attachLeaseDocument({
        data: { id: tenantId, file_path: path },
        headers: await authHeaders(),
      });
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
    const { data, error } = await supabase.storage
      .from("lease-documents")
      .createSignedUrl(path, 60);
    if (error || !data) {
      toast.error(error?.message ?? "Couldn't generate download link");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Tenant portal</h2>
        <p className="text-sm text-muted-foreground">
          {data ? (
            <>
              {data.total} tenant{data.total === 1 ? "" : "s"}
              {filtered ? " match your filters" : " on file"}.
            </>
          ) : (
            "Leases, rent status and signatures for every tenant."
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="relative min-w-[200px] flex-1">
          <Label htmlFor="tenant-search" className="sr-only">
            Search tenants
          </Label>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="tenant-search"
            className="pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tenant-payment">Rent status</Label>
          <select
            id="tenant-payment"
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value as typeof paymentStatus);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm capitalize"
          >
            <option value="">All statuses</option>
            {PAYMENT_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tenant-sort">Sort by</Label>
          <select
            id="tenant-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as (typeof TENANT_SORTS)[number])}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {TENANT_SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        >
          {sortDir === "asc" ? "Ascending" : "Descending"}
        </Button>
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setPaymentStatus("");
              setPage(1);
            }}
          >
            <X className="mr-1 h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      <DataPanel title="Leases">
        {error ? (
          <QueryError error={error} onRetry={() => refetch()} label="your tenants" />
        ) : isLoading && !data ? (
          <div className="text-sm text-muted-foreground">Loading tenants…</div>
        ) : tenants.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filtered ? "No tenants match your filters" : "No tenants on file yet"}
            description={
              filtered
                ? "Try a different name, email address or rent status."
                : "Tenants are added against a property from its detail page."
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {tenants.map((t) => (
              <div key={t.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to="/portal/divisions/real-estate/tenants/$id"
                      params={{ id: t.id }}
                      className="font-medium hover:underline"
                    >
                      {t.full_name}
                    </Link>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {t.propertyTitle ?? "—"}
                      {t.propertyCity ? ` · ${t.propertyCity}` : ""}
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
                  <StatusBadge
                    status={LEASE_BADGE[t.lease_signature_status] ?? t.lease_signature_status}
                  />
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => onDownloadLease(t.lease_document_path!)}
                      >
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        disabled={sendMut.isPending}
                        onClick={() => sendMut.mutate(t.id)}
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5" /> Send for signature
                      </Button>
                    )}

                    {t.lease_signature_status === "sent" && signingId !== t.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => setSigningId(t.id)}
                      >
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
                          onClick={() =>
                            signMut.mutate({ id: t.id, signed_name: signedName.trim() })
                          }
                        >
                          Confirm
                        </Button>
                      </div>
                    )}

                    {(t.lease_signature_status === "sent" ||
                      t.lease_signature_status === "draft") && (
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
            <div className="pt-4">
              <Pagination
                page={data?.page ?? 1}
                pageSize={data?.pageSize ?? pageSize}
                total={data?.total ?? 0}
                onPageChange={setPage}
                label="tenants"
              />
            </div>
          </div>
        )}
      </DataPanel>
    </div>
  );
}
