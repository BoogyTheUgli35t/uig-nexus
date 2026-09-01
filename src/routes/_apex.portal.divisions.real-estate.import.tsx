import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  IMPORT_ENTITIES,
  ENTITY_COLUMNS,
  buildPreview,
  sampleCsv,
  type ImportEntity,
} from "@/lib/realestate-import";
import { commitRealEstateImport } from "@/lib/realestate-import.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/import")({
  head: () => ({
    meta: [{ title: "Bulk import — UIG Real Estate" }, { name: "robots", content: "noindex" }],
  }),
  component: ImportPage,
});

const LABELS: Record<ImportEntity, string> = {
  properties: "Properties",
  units: "Units",
  tenants: "Tenants",
  leads: "Leads",
};

function ImportPage() {
  const [entity, setEntity] = useState<ImportEntity>("properties");
  const [csv, setCsv] = useState("");

  const preview = useMemo(() => (csv.trim() ? buildPreview(entity, csv) : null), [entity, csv]);
  const spec = ENTITY_COLUMNS[entity];

  const commit = useMutation({
    mutationFn: async () =>
      commitRealEstateImport({ data: { entity, csv }, headers: await authHeaders() }),
    onSuccess: (res) => {
      toast.success(`Imported ${res.inserted} ${LABELS[entity].toLowerCase()}`);
      if (res.unresolved.length) {
        toast.warning(`Unmatched property titles: ${res.unresolved.slice(0, 3).join(", ")}`);
      }
      setCsv("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const downloadSample = () => {
    const blob = new Blob([sampleCsv(entity)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uig-${entity}-sample.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setCsv(await file.text());
  };

  const canCommit = !!preview && preview.validCount > 0 && preview.missingRequired.length === 0;

  return (
    <div className="space-y-6">
      <DataPanel title="Bulk import">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Import record type">
            {IMPORT_ENTITIES.map((e) => (
              <Button
                key={e}
                role="tab"
                aria-selected={entity === e}
                variant={entity === e ? "default" : "outline"}
                size="sm"
                onClick={() => setEntity(e)}
              >
                {LABELS[e]}
              </Button>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Required columns: <span className="font-medium">{spec.required.join(", ")}</span>.
            Optional: {spec.optional.join(", ")}.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={downloadSample}>
              <Download className="mr-2 h-4 w-4" /> Download sample CSV
            </Button>
            <div>
              <Label htmlFor="csv-file" className="sr-only">
                Upload CSV file
              </Label>
              <input
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => void onFile(e.target.files?.[0])}
                className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-text">Or paste CSV</Label>
            <Textarea
              id="csv-text"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={8}
              placeholder={sampleCsv(entity)}
              className="font-mono text-xs"
            />
          </div>
        </div>
      </DataPanel>

      {preview && (
        <DataPanel
          title={`Preview — ${preview.validCount} valid, ${preview.errorCount} with errors`}
        >
          <div className="space-y-4">
            {preview.missingRequired.length > 0 && (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Missing required columns: {preview.missingRequired.join(", ")}
              </p>
            )}
            {preview.unknownColumns.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Ignored columns: {preview.unknownColumns.join(", ")}
              </p>
            )}

            <div className="max-h-[420px] overflow-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">Rows parsed from the uploaded CSV</caption>
                <thead className="bg-surface">
                  <tr>
                    <th scope="col" className="px-3 py-2">
                      Line
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Status
                    </th>
                    {preview.headers
                      .filter((h) => h)
                      .map((h) => (
                        <th key={h} scope="col" className="px-3 py-2 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.line} className="border-t border-border align-top">
                      <td className="px-3 py-2">{r.line}</td>
                      <td className="px-3 py-2">
                        {r.errors.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-500">
                            <CheckCircle2 className="h-3.5 w-3.5" /> OK
                          </span>
                        ) : (
                          <span className="text-destructive">{r.errors.join("; ")}</span>
                        )}
                      </td>
                      {preview.headers
                        .filter((h) => h)
                        .map((h) => (
                          <td key={h} className="px-3 py-2 whitespace-nowrap">
                            {r.raw[h] ?? ""}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button onClick={() => commit.mutate()} disabled={!canCommit || commit.isPending}>
              <Upload className="mr-2 h-4 w-4" />
              {commit.isPending
                ? "Importing…"
                : `Import ${preview.validCount} ${LABELS[entity].toLowerCase()}`}
            </Button>
          </div>
        </DataPanel>
      )}
    </div>
  );
}
