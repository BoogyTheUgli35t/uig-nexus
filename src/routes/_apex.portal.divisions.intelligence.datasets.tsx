import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Database } from "lucide-react";
import { toast } from "sonner";
import { getIntelligenceWorkspace, addDataset } from "@/lib/intelligence.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
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

  const { data, isLoading } = useQuery({
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

  const datasets = data?.datasets ?? [];
  const models = data?.models ?? [];

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
          <Button type="submit" disabled={!datasetName.trim() || datasetMut.isPending} variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </form>
      </DataPanel>

      <DataPanel title={`Dataset library (${datasets.length})`}>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading datasets…</div>
        ) : datasets.length === 0 ? (
          <EmptyState icon={Database} title="No datasets yet" description="Add a dataset above to feed model training." />
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
                        {d.source_division} · {d.rows_count.toLocaleString()} rows · {Number(d.size_mb)} MB
                      </div>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                  {linkedModels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {linkedModels.map((m) => (
                        <span key={m.id} className="rounded-full acc-bg-soft acc-text px-2 py-0.5 text-[10px]">
                          {m.name}
                        </span>
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
