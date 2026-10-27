import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Database } from "lucide-react";
import { toast } from "sonner";
import {
  DATASET_STATUSES,
  getIntelligenceWorkspace,
  addDataset,
} from "@/lib/intelligence.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, QueryError, StatusBadge } from "@/components/portal/blocks";
import { ListToolbar } from "@/components/portal/ListToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_apex/portal/divisions/intelligence/datasets")({
  head: () => ({ meta: [{ title: "Datasets — UIG Intelligence" }] }),
  component: DatasetsPage,
});

function DatasetsPage() {
  const qc = useQueryClient();
  const [datasetName, setDatasetName] = useState("");
  const [datasetRows, setDatasetRows] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [division, setDivision] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["intelligence-workspace"],
    queryFn: async () => getIntelligenceWorkspace({ headers: await authHeaders() }),
  });

  const datasetMut = useMutation({
    mutationFn: async () =>
      addDataset({
        data: { name: datasetName, rows_count: Number(datasetRows) || 0 },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Dataset added");
      setDatasetName("");
      setDatasetRows("");
      qc.invalidateQueries({ queryKey: ["intelligence-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allDatasets = data?.datasets ?? [];
  const models = data?.models ?? [];

  // `DATASET_STATUSES` was exported and referenced nowhere. A library with
  // "processing" and "error" rows in it is exactly the kind of list you want
  // to filter, since a failed upload otherwise hides among the ready ones.
  const sourceDivisions = Array.from(new Set(allDatasets.map((d) => d.source_division))).sort();
  const term = search.trim().toLowerCase();
  const datasets = allDatasets.filter(
    (d) =>
      (!status || d.status === status) &&
      (!division || d.source_division === division) &&
      (!term ||
        d.name.toLowerCase().includes(term) ||
        (d.description ?? "").toLowerCase().includes(term)),
  );
  const filtered = Boolean(term || status || division);
  const clear = () => {
    setSearch("");
    setStatus("");
    setDivision("");
  };

  return (
    <div className="space-y-6">
      <DataPanel title="Upload dataset">
        <form
          className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (datasetName.trim()) datasetMut.mutate();
          }}
        >
          <Input
            placeholder="Dataset name (e.g. Lagos rental comps, 2026)"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            maxLength={180}
          />
          <Input
            placeholder="Rows"
            value={datasetRows}
            onChange={(e) => setDatasetRows(e.target.value)}
            type="number"
            min={0}
            className="w-28"
          />
          <Button
            type="submit"
            disabled={!datasetName.trim() || datasetMut.isPending}
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </form>
      </DataPanel>

      {allDatasets.length > 0 && (
        <ListToolbar
          search={{
            id: "dataset-search",
            label: "Search datasets",
            placeholder: "Search by name or description…",
            value: search,
            onChange: setSearch,
          }}
          filters={[
            {
              id: "dataset-status",
              label: "Status",
              value: status,
              onChange: setStatus,
              options: DATASET_STATUSES,
              allLabel: "All statuses",
            },
            ...(sourceDivisions.length > 1
              ? [
                  {
                    id: "dataset-division",
                    label: "Source",
                    value: division,
                    onChange: setDivision,
                    options: sourceDivisions,
                    allLabel: "All divisions",
                  },
                ]
              : []),
          ]}
          onClear={clear}
        />
      )}

      <DataPanel
        title={
          filtered
            ? `Dataset library (${datasets.length} of ${allDatasets.length})`
            : `Dataset library (${allDatasets.length})`
        }
      >
        {error ? (
          <QueryError error={error} onRetry={() => refetch()} label="the dataset library" />
        ) : isLoading && !data ? (
          <div className="text-sm text-muted-foreground">Loading datasets…</div>
        ) : datasets.length === 0 ? (
          <EmptyState
            icon={Database}
            title={filtered ? "No datasets match your filters" : "No datasets yet"}
            description={
              filtered
                ? "Try a different name, status or source division."
                : "Add a dataset above to feed model training."
            }
          />
        ) : (
          <div className="space-y-3">
            {datasets.map((d) => {
              const linkedModels = models.filter((m) => m.dataset_id === d.id);
              return (
                <div key={d.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{d.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {d.source_division} · {d.rows_count.toLocaleString()} rows ·{" "}
                        {Number(d.size_mb)} MB
                      </div>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                  {linkedModels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {/* These were non-clickable spans, even though the model
                          detail route exists and the rows are already in hand. */}
                      {linkedModels.map((m) => (
                        <Link
                          key={m.id}
                          to="/portal/divisions/intelligence/models/$id"
                          params={{ id: m.id }}
                          className="rounded-full acc-bg-soft acc-text px-2 py-0.5 text-[10px] transition hover:brightness-125"
                        >
                          {m.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
