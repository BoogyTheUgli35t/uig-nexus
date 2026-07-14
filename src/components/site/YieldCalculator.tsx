import { useMemo, useState } from "react";
import { Sprout } from "lucide-react";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

// Indicative starting points per hectare — Nigerian commodity prices move
// fast with naira volatility and season, so every field below is editable.
// Maize and cassava defaults are grounded in July 2026 market data; the rest
// are reasonable agronomic estimates and should be treated the same way —
// a starting point to adjust, not a live price feed.
const CROPS = [
  { name: "Maize", yieldTonsPerHa: 2.5, pricePerTon: 450000, costPerHa: 350000 },
  { name: "Cassava", yieldTonsPerHa: 15, pricePerTon: 160000, costPerHa: 450000 },
  { name: "Rice (Paddy)", yieldTonsPerHa: 3, pricePerTon: 550000, costPerHa: 500000 },
  { name: "Tomatoes", yieldTonsPerHa: 10, pricePerTon: 250000, costPerHa: 600000 },
  { name: "Yam", yieldTonsPerHa: 12, pricePerTon: 200000, costPerHa: 500000 },
  { name: "Cocoa", yieldTonsPerHa: 0.5, pricePerTon: 2800000, costPerHa: 400000 },
  { name: "Groundnut", yieldTonsPerHa: 1.2, pricePerTon: 650000, costPerHa: 300000 },
  { name: "Soybean", yieldTonsPerHa: 1.5, pricePerTon: 600000, costPerHa: 320000 },
] as const;

export function YieldCalculator() {
  const [cropIndex, setCropIndex] = useState(0);
  const [hectares, setHectares] = useState(5);
  const [yieldPerHa, setYieldPerHa] = useState<number>(CROPS[0].yieldTonsPerHa);
  const [pricePerTon, setPricePerTon] = useState<number>(CROPS[0].pricePerTon);
  const [costPerHa, setCostPerHa] = useState<number>(CROPS[0].costPerHa);

  function selectCrop(i: number) {
    setCropIndex(i);
    setYieldPerHa(CROPS[i].yieldTonsPerHa);
    setPricePerTon(CROPS[i].pricePerTon);
    setCostPerHa(CROPS[i].costPerHa);
  }

  const result = useMemo(() => {
    const totalYield = hectares * yieldPerHa;
    const grossRevenue = totalYield * pricePerTon;
    const totalCost = hectares * costPerHa;
    const netProfit = grossRevenue - totalCost;
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
    return { totalYield, grossRevenue, totalCost, netProfit, roi };
  }, [hectares, yieldPerHa, pricePerTon, costPerHa]);

  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 sm:p-6">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sprout className="h-4 w-4 text-gold" /> Yield & ROI estimator
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Indicative starting points, not a live price feed — adjust the numbers to your local market before deciding anything.
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {CROPS.map((c, i) => (
          <button
            key={c.name}
            onClick={() => selectCrop(i)}
            className={
              i === cropIndex
                ? "rounded-full border border-gold bg-gold/10 px-3 py-1.5 text-xs text-gold"
                : "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition"
            }
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-muted-foreground">Farm size (hectares)</span>
          <input
            type="number"
            min={0.1}
            step={0.5}
            value={hectares}
            onChange={(e) => setHectares(Math.max(0, Number(e.target.value) || 0))}
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Expected yield (tons/ha)</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={yieldPerHa}
            onChange={(e) => setYieldPerHa(Math.max(0, Number(e.target.value) || 0))}
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Farm-gate price (₦/ton)</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={pricePerTon}
            onChange={(e) => setPricePerTon(Math.max(0, Number(e.target.value) || 0))}
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Input cost (₦/ha)</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={costPerHa}
            onChange={(e) => setCostPerHa(Math.max(0, Number(e.target.value) || 0))}
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-6 rounded-lg border border-gold/30 bg-gold/5 p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">Est. total yield</div>
            <div className="mt-1 font-semibold">{result.totalYield.toLocaleString("en-NG")} t</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Gross revenue</div>
            <div className="mt-1 font-semibold">{naira(result.grossRevenue)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total input cost</div>
            <div className="mt-1 font-semibold">{naira(result.totalCost)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Net profit</div>
            <div className={`mt-1 font-bold ${result.netProfit >= 0 ? "text-gradient-gold" : "text-destructive"}`}>
              {naira(result.netProfit)}
            </div>
          </div>
        </div>
        <div className="mt-4 border-t border-gold/20 pt-3 text-sm">
          Estimated ROI: <span className="font-bold text-gold">{result.roi.toFixed(1)}%</span> per season
        </div>
      </div>
    </div>
  );
}
