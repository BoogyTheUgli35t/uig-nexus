import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DoorOpen, Search, X } from "lucide-react";
import { listUnitsPaged, UNIT_SORTS } from "@/lib/realestate-crud.functions";
import { UNIT_STATUSES } from "@/lib/realestate.functions";
import { authHeaders } from "@/lib/auth-headers";
import { EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Pagination } from "@/components/portal/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/units/")({
  component: UnitsPage,
});

const naira = (n: number) => {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
};

const SORT_LABEL: Record<(typeof UNIT_SORTS)[number], string> = {
  unit_number: "Unit number",
  rent_amount: "Rent",
  created_at: "Newest",
};

function UnitsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState<(typeof UNIT_SORTS)[number]>("unit_number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-units", search, status, sortBy, sortDir, page],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      listUnitsPaged({
        headers: await authHeaders(),
        data: {
          search: search || undefined,
          status: (status || undefined) as (typeof UNIT_STATUSES)[number] | undefined,
          sortBy,
          sortDir,
          page,
          pageSize,
        },
      }),
  });

  const rows = data?.rows ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Units</h2>
        <p className="text-sm text-muted-foreground">
          Every unit across the portfolio, with occupancy and rent at a glance.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="relative min-w-[200px] flex-1">
          <Label htmlFor="unit-search" className="sr-only">
            Search units
          </Label>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="unit-search"
            className="pl-9"
            placeholder="Search by unit number…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unit-status">Status</Label>
          <select
            id="unit-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">All statuses</option>
            {UNIT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unit-sort">Sort by</Label>
          <select
            id="unit-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as (typeof UNIT_SORTS)[number])}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {UNIT_SORTS.map((s) => (
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
        {(search || status) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatus("");
              setPage(1);
            }}
          >
            <X className="mr-1 h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {isLoading && !data ? (
        <div className="text-sm text-muted-foreground">Loading units…</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="No units match your filters"
          description="Units are added from a property's detail page."
        />
      ) : (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Unit</th>
                  <th className="py-2 pr-4 font-medium">Property</th>
                  <th className="py-2 pr-4 font-medium">Bed / Bath</th>
                  <th className="py-2 pr-4 font-medium">Rent</th>
                  <th className="py-2 pr-4 font-medium">Tenant</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-4 font-medium">
                      <Link
                        to="/portal/divisions/real-estate/units/$id"
                        params={{ id: u.id }}
                        className="hover:underline"
                      >
                        {u.unit_number}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {u.propertyTitle}
                      {u.propertyCity ? ` · ${u.propertyCity}` : ""}
                    </td>
                    <td className="py-3 pr-4">
                      {u.bedrooms} / {u.bathrooms}
                    </td>
                    <td className="py-3 pr-4">{naira(Number(u.rent_amount))}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{u.tenantName ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={u.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Pagination
              page={data?.page ?? 1}
              pageSize={data?.pageSize ?? pageSize}
              total={data?.total ?? 0}
              onPageChange={setPage}
              label="units"
            />
          </div>
        </div>
      )}
    </div>
  );
}
