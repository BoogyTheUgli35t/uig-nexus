import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Users, Phone, MapPin, ChevronRight, ChevronLeft, Check, Link2 } from "lucide-react";
import {
  FARMER_STATUSES,
  getAgriWorkspace,
  onboardFarmer,
  linkFarmerAccount,
} from "@/lib/agritech.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, QueryError, StatusBadge } from "@/components/portal/blocks";
import { ListToolbar } from "@/components/portal/ListToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_apex/portal/divisions/agritech/farmers")({
  component: FarmersPage,
});

function FarmersPage() {
  const qc = useQueryClient();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [cooperative, setCooperative] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["agri-workspace"],
    queryFn: async () => getAgriWorkspace({ headers: await authHeaders() }),
  });

  const linkMut = useMutation({
    mutationFn: async (v: { farmer_id: string; email: string }) =>
      linkFarmerAccount({ data: v, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Portal account linked — they'll see their own farm on next sign-in.");
      setLinkingId(null);
      setLinkEmail("");
      qc.invalidateQueries({ queryKey: ["agri-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allFarmers = data?.farmers ?? [];

  // Cooperatives come from the data rather than a constant: they're created by
  // field officers, so a hardcoded list would go stale the first time one is.
  const cooperatives = Array.from(
    new Set(allFarmers.map((f) => f.cooperative).filter((c): c is string => Boolean(c))),
  ).sort();

  const term = search.trim().toLowerCase();
  const farmers = allFarmers.filter(
    (f) =>
      (!status || f.status === status) &&
      (!cooperative || f.cooperative === cooperative) &&
      (!term ||
        f.full_name.toLowerCase().includes(term) ||
        (f.phone ?? "").toLowerCase().includes(term) ||
        (f.location ?? "").toLowerCase().includes(term) ||
        (f.primary_crop ?? "").toLowerCase().includes(term)),
  );

  const filtered = Boolean(term || status || cooperative);
  const clear = () => {
    setSearch("");
    setStatus("");
    setCooperative("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Farmers</h2>
          <p className="text-sm text-muted-foreground">
            {filtered
              ? `${farmers.length} of ${allFarmers.length} farmers match.`
              : `${allFarmers.length} farmer${allFarmers.length === 1 ? "" : "s"} on file.`}
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Onboard farmer
        </Button>
      </div>

      {allFarmers.length > 0 && (
        <ListToolbar
          search={{
            id: "farmer-search",
            label: "Search farmers",
            placeholder: "Search by name, phone, location or crop…",
            value: search,
            onChange: setSearch,
          }}
          filters={[
            {
              id: "farmer-status",
              label: "Status",
              value: status,
              onChange: setStatus,
              options: FARMER_STATUSES,
              allLabel: "All statuses",
            },
            ...(cooperatives.length > 0
              ? [
                  {
                    id: "farmer-coop",
                    label: "Cooperative",
                    value: cooperative,
                    onChange: setCooperative,
                    options: cooperatives,
                    allLabel: "All cooperatives",
                  },
                ]
              : []),
          ]}
          onClear={clear}
        />
      )}

      {error ? (
        <QueryError error={error} onRetry={() => refetch()} label="the farmer directory" />
      ) : isLoading && !data ? (
        <div className="text-sm text-muted-foreground">Loading farmers…</div>
      ) : farmers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={filtered ? "No farmers match your filters" : "No farmers onboarded yet"}
          description={
            filtered
              ? "Try a different name, crop, cooperative or status."
              : "Onboard the first farmer above — it takes four fields."
          }
          action={
            filtered ? (
              <Button variant="outline" size="sm" onClick={clear}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataPanel title="Directory">
          <div className="divide-y divide-border">
            {farmers.map((f) => (
              <div
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">{f.full_name}</div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {f.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {f.phone}
                      </span>
                    )}
                    {f.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {f.location}
                      </span>
                    )}
                    {f.cooperative && <span>{f.cooperative}</span>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm">
                    {f.hectares} ha · {f.primary_crop ?? "—"}
                  </div>
                  <div className="mt-1">
                    <StatusBadge status={f.status} />
                  </div>
                  <div className="mt-2">
                    {f.user_id ? (
                      <span className="text-[11px] text-muted-foreground">Portal linked</span>
                    ) : linkingId === f.id ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          autoFocus
                          type="email"
                          value={linkEmail}
                          onChange={(e) => setLinkEmail(e.target.value)}
                          placeholder="their portal email"
                          className="h-7 w-40 text-xs"
                        />
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          disabled={!linkEmail.trim() || linkMut.isPending}
                          onClick={() =>
                            linkMut.mutate({ farmer_id: f.id, email: linkEmail.trim() })
                          }
                        >
                          Link
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setLinkingId(f.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        <Link2 className="h-3 w-3" /> Link portal account
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DataPanel>
      )}

      {wizardOpen && <OnboardWizard onClose={() => setWizardOpen(false)} />}
    </div>
  );
}

function OnboardWizard({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [cooperative, setCooperative] = useState("");
  const [crop, setCrop] = useState("");
  const [hectares, setHectares] = useState("");
  const [fieldName, setFieldName] = useState("");

  const onboardMut = useMutation({
    mutationFn: async () =>
      onboardFarmer({
        data: {
          full_name: name,
          phone,
          location,
          cooperative,
          primary_crop: crop,
          hectares: Number(hectares) || 0,
          first_field_name: fieldName,
        },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Farmer onboarded");
      qc.invalidateQueries({ queryKey: ["agri-workspace"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const steps = ["Identity", "Farm details", "First field"];
  const canNext = step === 0 ? name.trim().length > 0 : true;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Onboard a farmer</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {steps.length} — {steps[step]}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-gold" : "bg-muted"}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={150} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Location (state)</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={150}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Cooperative</Label>
              <Input
                value={cooperative}
                onChange={(e) => setCooperative(e.target.value)}
                maxLength={150}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Primary crop</Label>
              <Input value={crop} onChange={(e) => setCrop(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Total hectares</Label>
              <Input
                type="number"
                min={0}
                value={hectares}
                onChange={(e) => setHectares(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">First field name (optional)</Label>
              <Input
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="e.g. North Plot"
                maxLength={150}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave blank to skip — you can add fields later from the Fields tab.
            </p>
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              Next <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={onboardMut.isPending}
              onClick={() => onboardMut.mutate()}
            >
              <Check className="mr-1.5 h-4 w-4" /> Finish
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
