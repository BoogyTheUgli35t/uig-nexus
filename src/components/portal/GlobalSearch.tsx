import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Folder, LayoutGrid, Settings, ScrollText, Loader2, Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DIVISIONS } from "@/lib/divisions";
import { searchPortal } from "@/lib/global-search.functions";
import { authHeaders } from "@/lib/auth-headers";

type Project = { id: string; name: string; type: string };
type CrossResult = Awaited<ReturnType<typeof searchPortal>>;

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [crossResults, setCrossResults] = React.useState<CrossResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Live project search
  React.useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      // Load recent projects on open
      const load = async () => {
        setLoading(true);
        const { data } = await supabase
          .from("projects")
          .select("id, name, type")
          .order("created_at", { ascending: false })
          .limit(6);
        setProjects((data as Project[]) ?? []);
        setCrossResults(null);
        setLoading(false);
      };
      load();
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const [{ data }, cross] = await Promise.all([
        supabase.from("projects").select("id, name, type").ilike("name", `%${trimmed}%`).limit(8),
        trimmed.length >= 2
          ? searchPortal({ headers: await authHeaders(), data: { query: trimmed } }).catch(
              () => null,
            )
          : Promise.resolve(null),
      ]);
      setProjects((data as Project[]) ?? []);
      setCrossResults(cross);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, open]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    setQuery("");
    command();
  }, []);

  // Static nav items that always show
  const navItems = [
    { label: "Dashboard", icon: LayoutGrid, to: "/portal/dashboard" },
    { label: "Projects", icon: Folder, to: "/portal/projects" },
    { label: "Activity Timeline", icon: ScrollText, to: "/portal/audit" },
    { label: "Settings", icon: Settings, to: "/portal/settings" },
  ];

  const filteredNav = query.trim()
    ? navItems.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()))
    : navItems;

  const filteredDivisions = query.trim()
    ? DIVISIONS.filter(
        (d) =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.short.toLowerCase().includes(query.toLowerCase()),
      )
    : DIVISIONS;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground px-3 py-2 relative h-8 w-full justify-start rounded-lg bg-muted/50 text-sm font-normal text-muted-foreground shadow-none pr-12"
      >
        <span className="hidden sm:inline">Search portal...</span>
        <span className="sm:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setQuery("");
        }}
      >
        <CommandInput
          placeholder="Search projects, divisions, pages..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : (
            <>
              <CommandEmpty>No results found for &ldquo;{query}&rdquo;.</CommandEmpty>

              {filteredNav.length > 0 && (
                <CommandGroup heading="Navigation">
                  {filteredNav.map((item) => (
                    <CommandItem
                      key={item.to}
                      value={item.label}
                      onSelect={() => runCommand(() => navigate({ to: item.to }))}
                    >
                      <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{item.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {projects.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Projects">
                    {projects.map((p) => (
                      <CommandItem
                        key={p.id}
                        value={p.name}
                        onSelect={() =>
                          runCommand(() =>
                            navigate({ to: "/portal/projects/$id", params: { id: p.id } }),
                          )
                        }
                      >
                        <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{p.name}</span>
                        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
                          {p.type}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {crossResults &&
                (
                  [
                    ["Properties", crossResults.properties],
                    ["Shipments", crossResults.shipments],
                    ["Farmers", crossResults.farmers],
                    ["Ideas", crossResults.ideas],
                    ["Tech projects", crossResults.techProjects],
                  ] as const
                ).map(([heading, items]) =>
                  items.length > 0 ? (
                    <React.Fragment key={heading}>
                      <CommandSeparator />
                      <CommandGroup heading={heading}>
                        {items.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={`${heading}-${item.label}`}
                            onSelect={() =>
                              runCommand(() =>
                                navigate({
                                  to: item.to,
                                  params: item.to.includes("$id") ? { id: item.id } : undefined,
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                } as any),
                              )
                            }
                          >
                            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{item.label}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </React.Fragment>
                  ) : null,
                )}

              {filteredDivisions.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Divisions">
                    {filteredDivisions.map((d) => (
                      <CommandItem
                        key={d.slug}
                        value={d.name}
                        onSelect={() =>
                          runCommand(() =>
                            navigate({
                              to: "/portal/divisions/$slug",
                              params: { slug: d.slug },
                            }),
                          )
                        }
                      >
                        <d.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{d.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
