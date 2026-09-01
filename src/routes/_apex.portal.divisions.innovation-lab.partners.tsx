import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Check,
  GraduationCap,
  Handshake,
  Landmark,
  Mail,
  Pencil,
  Plus,
  Rocket,
  Search,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  PARTNER_TYPES,
  addPartner,
  listPartners,
  removePartner,
  updatePartner,
} from "@/lib/innovation.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, KpiStat } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_apex/portal/divisions/innovation-lab/partners")({
  component: PartnersPage,
});

const TYPE_META: Record<string, { label: string; icon: LucideIcon }> = {
  corporate: { label: "Corporate", icon: Building2 },
  academic: { label: "Academic", icon: GraduationCap },
  venture_capital: { label: "Venture capital", icon: TrendingUp },
  incubator: { label: "Incubator", icon: Rocket },
  government: { label: "Government", icon: Landmark },
  ngo: { label: "NGO", icon: Users },
};

function typeMeta(type: string | null) {
  return (
    TYPE_META[type ?? ""] ?? {
      label: type ? type.replace(/_/g, " ") : "Unclassified",
      icon: Handshake,
    }
  );
}

function PartnersPage() {
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [type, setType] = useState<string>("corporate");
  const [contact, setContact] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editContact, setEditContact] = useState("");

  const { data: partners, isLoading } = useQuery({
    queryKey: ["innovation-partners"],
    queryFn: async () => listPartners({ headers: await authHeaders() }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["innovation-partners"] });
    // The overview's summary card reads the same rows through the workspace query.
    qc.invalidateQueries({ queryKey: ["innovation-workspace"] });
  };

  const addMut = useMutation({
    mutationFn: async () =>
      addPartner({ data: { name, type, contact }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Partner added");
      setName("");
      setContact("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async () =>
      updatePartner({
        data: { id: editingId!, name: editName, type: editType, contact: editContact },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Partner updated");
      setEditingId(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: async (id: string) => removePartner({ data: { id }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Partner removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => partners ?? [], [partners]);

  const counts = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const p of rows)
      byType[p.type ?? "unclassified"] = (byType[p.type ?? "unclassified"] ?? 0) + 1;
    return byType;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      if (typeFilter !== "all" && (p.type ?? "unclassified") !== typeFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.contact ?? "").toLowerCase().includes(q) ||
        (p.type ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, typeFilter]);

  function startEdit(p: { id: string; name: string; type: string | null; contact: string | null }) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditType(p.type ?? "");
    setEditContact(p.contact ?? "");
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={Handshake} label="Total partners" value={isLoading ? "—" : rows.length} />
        <KpiStat
          icon={Building2}
          label="Corporate"
          value={isLoading ? "—" : (counts["corporate"] ?? 0)}
        />
        <KpiStat
          icon={TrendingUp}
          label="Venture capital"
          value={isLoading ? "—" : (counts["venture_capital"] ?? 0)}
        />
        <KpiStat
          icon={GraduationCap}
          label="Academic"
          value={isLoading ? "—" : (counts["academic"] ?? 0)}
        />
      </div>

      <DataPanel title="Register an ecosystem partner">
        <form
          className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1.4fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) addMut.mutate();
          }}
        >
          <Input
            placeholder="Partner name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={150}
            required
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            aria-label="Partner type"
          >
            {PARTNER_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_META[t].label}
              </option>
            ))}
          </select>
          <Input
            placeholder="Contact — email, phone or lead"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            maxLength={200}
          />
          <Button
            type="submit"
            disabled={!name.trim() || addMut.isPending}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </form>
      </DataPanel>

      <DataPanel title={`Partner directory (${filtered.length})`}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, type or contact…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            aria-label="Filter by partner type"
          >
            <option value="all">All types ({rows.length})</option>
            {PARTNER_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_META[t].label} ({counts[t] ?? 0})
              </option>
            ))}
            {counts["unclassified"] ? (
              <option value="unclassified">Unclassified ({counts["unclassified"]})</option>
            ) : null}
          </select>
        </div>

        <div className="mt-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading partners…</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Handshake}
              title={
                rows.length === 0 ? "No partners registered yet" : "No partners match that filter"
              }
              description={
                rows.length === 0
                  ? "Add the corporates, funds, universities and incubators the Lab co-builds with, so the whole team works from one list."
                  : "Try a different type or clear the search."
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((p) => {
                const meta = typeMeta(p.type);
                const Icon = meta.icon;
                const isEditing = editingId === p.id;
                return (
                  <li key={p.id} className="py-3 first:pt-0 last:pb-0">
                    {isEditing ? (
                      <form
                        className="grid gap-2 sm:grid-cols-[1.4fr_1fr_1.4fr_auto_auto]"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (editName.trim()) updateMut.mutate();
                        }}
                      >
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          maxLength={150}
                          required
                          aria-label="Partner name"
                        />
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value)}
                          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                          aria-label="Partner type"
                        >
                          <option value="">Unclassified</option>
                          {PARTNER_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {TYPE_META[t].label}
                            </option>
                          ))}
                        </select>
                        <Input
                          value={editContact}
                          onChange={(e) => setEditContact(e.target.value)}
                          maxLength={200}
                          aria-label="Contact"
                        />
                        <Button type="submit" size="sm" disabled={updateMut.isPending}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg acc-bg-soft acc-text">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{p.name}</div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="capitalize">{meta.label}</span>
                            {p.contact && (
                              <span className="inline-flex items-center gap-1 font-mono">
                                <Mail className="h-3 w-3" /> {p.contact}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(p)}
                            aria-label={`Edit ${p.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={removeMut.isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Remove ${p.name} from the partner directory? This cannot be undone.`,
                                )
                              ) {
                                removeMut.mutate(p.id);
                              }
                            }}
                            aria-label={`Remove ${p.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DataPanel>
    </div>
  );
}
