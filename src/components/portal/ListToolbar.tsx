import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ListFilter = {
  /** Used for the input id and the label's `htmlFor` — must be unique on the page. */
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  /** Copy for the "no filter" option, e.g. "All statuses". */
  allLabel?: string;
  /** Pretty-print an option; defaults to replacing underscores with spaces. */
  format?: (option: string) => string;
};

/**
 * The search + filter strip above a portal list.
 *
 * Search and filtering existed on 5 of roughly 30 list pages, and the
 * fingerprint of the gap was six exported-but-unreferenced constant arrays —
 * `FARMER_STATUSES`, `ALERT_SEVERITIES`, `ROUTE_STATUSES`, `MODEL_TYPES`,
 * `DATASET_STATUSES`, `TASK_STATUSES`. Each was a dropdown somebody designed
 * and nobody built. Rather than hand-rolling the same strip a sixth time,
 * every list gets this one, so the controls sit in the same place and behave
 * the same way across all six divisions.
 */
export function ListToolbar({
  search,
  filters = [],
  onClear,
  right,
}: {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    /** Screen-reader label; the visible placeholder is usually enough sighted cue. */
    label?: string;
    id?: string;
  };
  filters?: ListFilter[];
  /** Rendered as a "Clear" button when anything is active. */
  onClear?: () => void;
  /** Extra controls pinned to the right, e.g. a sort direction toggle. */
  right?: ReactNode;
}) {
  const active = Boolean(search?.value) || filters.some((f) => f.value);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
      {search && (
        <div className="relative min-w-[200px] flex-1">
          <Label htmlFor={search.id ?? "list-search"} className="sr-only">
            {search.label ?? "Search"}
          </Label>
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={search.id ?? "list-search"}
            className="pl-9"
            placeholder={search.placeholder ?? "Search…"}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
          />
        </div>
      )}

      {filters.map((f) => (
        <div key={f.id} className="space-y-1.5">
          <Label htmlFor={f.id}>{f.label}</Label>
          <select
            id={f.id}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm capitalize"
          >
            <option value="">{f.allLabel ?? "All"}</option>
            {f.options.map((o) => (
              <option key={o} value={o}>
                {f.format ? f.format(o) : o.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      ))}

      {right}

      {active && onClear && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-1 h-3.5 w-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}
