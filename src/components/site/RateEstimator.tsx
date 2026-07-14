import { useMemo, useState } from "react";
import { Truck, Zap } from "lucide-react";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan"] as const;
type City = (typeof CITIES)[number];

// Approximate road distances (km) — stable geography, not a price feed, so
// no need to re-verify these against a live source the way commodity or
// mortgage rates would need to be.
const DISTANCES: Record<string, number> = {
  "Lagos-Abuja": 750,
  "Lagos-Port Harcourt": 600,
  "Lagos-Kano": 1000,
  "Lagos-Ibadan": 130,
  "Abuja-Port Harcourt": 500,
  "Abuja-Kano": 350,
  "Abuja-Ibadan": 600,
  "Port Harcourt-Kano": 1150,
  "Port Harcourt-Ibadan": 500,
  "Kano-Ibadan": 900,
};

function distanceBetween(a: City, b: City): number {
  if (a === b) return 0;
  return DISTANCES[`${a}-${b}`] ?? DISTANCES[`${b}-${a}`] ?? 0;
}

function etaFor(distanceKm: number, express: boolean): string {
  if (distanceKm === 0) return express ? "Same day" : "Same day – next day";
  if (distanceKm <= 200) return express ? "Same day" : "Next day";
  if (distanceKm <= 600) return express ? "1 day" : "1–2 days";
  if (distanceKm <= 1000) return express ? "2 days" : "2–3 days";
  return express ? "2–3 days" : "3–4 days";
}

export function RateEstimator() {
  const [origin, setOrigin] = useState<City>("Lagos");
  const [destination, setDestination] = useState<City>("Abuja");
  const [weight, setWeight] = useState(5);
  const [express, setExpress] = useState(false);

  const result = useMemo(() => {
    const distanceKm = distanceBetween(origin, destination);
    const base = distanceKm === 0 ? 1500 : 3000;
    const distanceCost = distanceKm * 130;
    const weightCost = weight * 180;
    const subtotal = base + distanceCost + weightCost;
    const total = express ? subtotal * 1.4 : subtotal;
    return { distanceKm, total, eta: etaFor(distanceKm, express) };
  }, [origin, destination, weight, express]);

  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 sm:p-6">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Truck className="h-4 w-4 text-gold" /> Shipment rate estimator
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Ballpark pricing for planning purposes — get an exact quote through the API or our team.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-muted-foreground">Origin</span>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value as City)}
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Destination</span>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value as City)}
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Package weight (kg)</span>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={weight}
            onChange={(e) => setWeight(Math.max(0, Number(e.target.value) || 0))}
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setExpress((v) => !v)}
            className={
              express
                ? "flex w-full items-center justify-center gap-1.5 rounded-md border border-gold bg-gold/10 px-3 py-2 text-sm text-gold"
                : "flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition"
            }
          >
            <Zap className="h-3.5 w-3.5" /> {express ? "Express selected" : "Standard (click for express)"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gold/30 bg-gold/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Estimated rate</div>
            <div className="mt-1 text-2xl font-bold text-gradient-gold">{naira(result.total)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Estimated delivery</div>
            <div className="mt-1 font-semibold">{result.eta}</div>
          </div>
        </div>
        {result.distanceKm > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            ~{result.distanceKm.toLocaleString("en-NG")} km, {origin} → {destination}
          </div>
        )}
      </div>
    </div>
  );
}
