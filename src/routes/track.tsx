import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, PackageCheck, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section } from "@/components/site/sections";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, EmptyState } from "@/components/portal/blocks";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track your shipment — UIG Logistics" },
      {
        name: "description",
        content: "Enter your UIG Logistics tracking code to see live shipment status.",
      },
    ],
  }),
  component: TrackPage,
});

type Tracking = {
  reference: string;
  status: string;
  pickup_city: string | null;
  dropoff_city: string | null;
  eta: string | null;
  delivered_at: string | null;
  priority: string;
  pod_photo_url: string | null;
};

type TrackEvent = { status: string; note: string | null; created_at: string };

/**
 * Public, unauthenticated shipment lookup — no portal login required. Reads through
 * the `track_shipment` / `track_shipment_events` Postgres functions, which are the
 * only thing granted to the `anon` role and only ever return a hand-picked, safe
 * column list for the exact tracking code supplied (never a listing).
 */
function TrackPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<Tracking | null>(null);
  const [events, setEvents] = useState<TrackEvent[]>([]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const trimmed = code.trim().toUpperCase();
      const res = await fetch(`/api/public/track?code=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error("lookup failed");
      const json = (await res.json()) as { shipment: Tracking | null; events: TrackEvent[] };
      setResult(json.shipment);
      setEvents(json.events ?? []);
    } catch {
      setResult(null);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="UIG Logistics"
        title="Track your shipment"
        subtitle="Enter the tracking code from your dispatch confirmation to see live status."
      >
        <form onSubmit={onSearch} className="flex max-w-md gap-2">
          <Input
            placeholder="e.g. TRK-7H2K9A"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={40}
            className="font-mono"
          />
          <Button type="submit" disabled={!code.trim() || loading}>
            <Search className="mr-2 h-4 w-4" /> {loading ? "Searching…" : "Track"}
          </Button>
        </form>
      </PageHero>

      <Section className="!py-14">
        {!searched ? null : loading ? (
          <p className="text-sm text-muted-foreground">Looking up your shipment…</p>
        ) : !result ? (
          <EmptyState
            icon={PackageCheck}
            title="No shipment found"
            description="Double-check the tracking code and try again."
          />
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-sm text-muted-foreground">{result.reference}</div>
                  <div className="mt-1 flex items-center gap-1 text-lg font-semibold">
                    <MapPin className="h-4 w-4" /> {result.pickup_city ?? "—"} → {result.dropoff_city ?? "—"}
                  </div>
                </div>
                <StatusBadge status={result.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {result.eta && <span>ETA {result.eta}</span>}
                {result.priority !== "standard" && <span className="capitalize">{result.priority} priority</span>}
                {result.delivered_at && <span>Delivered {new Date(result.delivered_at).toLocaleString()}</span>}
              </div>
              {result.pod_photo_url && (
                <img
                  src={supabase.storage.from("pod-photos").getPublicUrl(result.pod_photo_url).data.publicUrl}
                  alt="Delivery proof"
                  className="mt-4 h-40 w-40 rounded-lg border border-border object-cover"
                />
              )}
            </div>

            {events.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-6">
                <h3 className="font-semibold">Timeline</h3>
                <div className="mt-4 space-y-4">
                  {events.map((ev, i) => (
                    <div key={i} className="flex gap-3">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-gold" />
                      <div>
                        <div className="text-sm font-medium capitalize">
                          {ev.status.replace(/_/g, " ")}
                        </div>
                        {ev.note && <div className="text-xs text-muted-foreground">{ev.note}</div>}
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" /> {new Date(ev.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>
    </SiteLayout>
  );
}
