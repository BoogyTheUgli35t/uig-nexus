import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Building2, Plus, Search, X, Scale, BedDouble, Bath, Ruler, Star } from "lucide-react";
import { PROPERTY_TYPES, PROPERTY_STATUSES } from "@/lib/realestate.functions";
import { listPropertiesPaged, PROPERTY_SORTS } from "@/lib/realestate-crud.functions";
import { authHeaders } from "@/lib/auth-headers";
import { EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Pagination } from "@/components/portal/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveImageUrl } from "@/lib/utils";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/properties/")({
  component: PropertiesPage,
});

const naira = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
};

const SORT_LABEL: Record<(typeof PROPERTY_SORTS)[number], string> = {
  created_at: "Date added",
  price: "Price",
  title: "Title",
  area_sqm: "Area",
};

function coverUrl(path: string | null) {
  if (!path) return null;
  return resolveImageUrl("property-images", path);
}

function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [city, setCity] = useState("");
  const [sortBy, setSortBy] = useState<(typeof PROPERTY_SORTS)[number]>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-properties", search, type, status, city, sortBy, sortDir, page],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      listPropertiesPaged({
        headers: await authHeaders(),
        data: {
          search: search || undefined,
          propertyType: (type || undefined) as (typeof PROPERTY_TYPES)[number] | undefined,
          status: (status || undefined) as (typeof PROPERTY_STATUSES)[number] | undefined,
          city: city || undefined,
          sortBy,
          sortDir,
          page,
          pageSize,
        },
      }),
  });

  const properties = data?.rows ?? [];
  const compareItems = useMemo(
    () => properties.filter((p) => compareIds.includes(p.id)),
    [properties, compareIds],
  );

  function toggleCompare(id: string) {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev,
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Property listings</h2>
          <p className="text-sm text-muted-foreground">
            {data?.total ?? 0} propert{(data?.total ?? 0) === 1 ? "y" : "ies"} in the portfolio.

          </p>
        </div>
        <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90">
          <Link to="/portal/divisions/real-estate/properties/new">
            <Plus className="mr-2 h-4 w-4" /> List a property
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">All types</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">All statuses</option>
          {PROPERTY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <Input
          className="max-w-[160px]"
          placeholder="City"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-end gap-2">
          <Label htmlFor="prop-sort" className="sr-only">
            Sort properties
          </Label>
          <select
            id="prop-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as (typeof PROPERTY_SORTS)[number])}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {PROPERTY_SORTS.map((s) => (
              <option key={s} value={s}>
                Sort: {SORT_LABEL[s]}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          >
            {sortDir === "asc" ? "Ascending" : "Descending"}
          </Button>
        </div>
        {(search || type || status || city) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setType("");
              setStatus("");
              setCity("");
            }}
          >
            <X className="mr-1 h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Comparison bar */}
      {compareItems.length > 0 && (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gold">
            <Scale className="h-4 w-4" /> Comparing {compareItems.length} propert
            {compareItems.length === 1 ? "y" : "ies"}
            <button
              onClick={() => setCompareIds([])}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <tbody>
                <tr className="border-b border-border/60">
                  <td className="py-2 pr-4 text-muted-foreground">Title</td>
                  {compareItems.map((p) => (
                    <td key={p.id} className="py-2 pr-4 font-medium">
                      {p.title}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border/60">
                  <td className="py-2 pr-4 text-muted-foreground">Price</td>
                  {compareItems.map((p) => (
                    <td key={p.id} className="py-2 pr-4">
                      {naira(Number(p.price))}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border/60">
                  <td className="py-2 pr-4 text-muted-foreground">Bed / Bath</td>
                  {compareItems.map((p) => (
                    <td key={p.id} className="py-2 pr-4">
                      {p.bedrooms} / {p.bathrooms}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border/60">
                  <td className="py-2 pr-4 text-muted-foreground">Area</td>
                  {compareItems.map((p) => (
                    <td key={p.id} className="py-2 pr-4">
                      {Number(p.area_sqm)} m²
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-muted-foreground">Status</td>
                  {compareItems.map((p) => (
                    <td key={p.id} className="py-2 pr-4">
                      <StatusBadge status={p.status} />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading properties…</div>
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties match your filters"
          description="Try clearing filters or list a new property."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <div
              key={p.id}
              className="group relative rounded-xl border border-border bg-surface overflow-hidden hover:acc-border-soft transition"
            >
              <label
                className="absolute left-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur px-2 py-1 text-[10px] font-medium text-muted-foreground cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={compareIds.includes(p.id)}
                  onChange={() => toggleCompare(p.id)}
                  disabled={!compareIds.includes(p.id) && compareIds.length >= 3}
                />
                Compare
              </label>
              {p.featured && (
                <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-gold/90 px-2 py-1 text-[10px] font-semibold text-gold-foreground">
                  <Star className="h-3 w-3 fill-current" /> Featured
                </span>
              )}
              <Link to="/portal/divisions/real-estate/properties/$id" params={{ id: p.id }}>
                <div className="aspect-[4/3] bg-surface-elevated overflow-hidden">
                  {p.coverImagePath ? (
                    <img
                      src={coverUrl(p.coverImagePath)!}
                      alt={p.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Building2 className="h-8 w-8 opacity-30" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium leading-snug">{p.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground capitalize">
                        {p.property_type.replace(/_/g, " ")}
                        {p.city ? ` · ${p.city}` : ""}
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-3 text-xl font-display font-bold acc-text">
                    {naira(Number(p.price))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {p.bedrooms > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5" /> {p.bedrooms}
                      </span>
                    )}
                    {p.bathrooms > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" /> {p.bathrooms}
                      </span>
                    )}
                    {p.area_sqm > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Ruler className="h-3.5 w-3.5" /> {Number(p.area_sqm)} m²
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {(data?.total ?? 0) > 0 && (
        <Pagination
          page={data?.page ?? 1}
          pageSize={data?.pageSize ?? pageSize}
          total={data?.total ?? 0}
          onPageChange={setPage}
          label="properties"
        />
      )}
    </div>
  );
}
