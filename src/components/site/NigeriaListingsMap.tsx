import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

export type MapLocation = {
  state: string;
  totalListings: number;
  forSale: number;
  forRent: number;
  minPrice: number;
};

// Approximate relative positions on a stylised (non-geodetic) outline of
// Nigeria — good enough for "roughly where in the country," not a survey
// instrument. Extend this map if more states get seeded.
const STATE_POSITIONS: Record<string, { x: number; y: number }> = {
  Kano: { x: 305, y: 115 },
  "FCT (Abuja)": { x: 300, y: 330 },
  Enugu: { x: 385, y: 500 },
  Lagos: { x: 130, y: 560 },
  Rivers: { x: 295, y: 615 },
};

const naira = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
};

export function NigeriaListingsMap({ locations }: { locations: MapLocation[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const plottable = locations.filter((l) => STATE_POSITIONS[l.state]);
  if (plottable.length === 0) return null;

  const maxListings = Math.max(...plottable.map((l) => l.totalListings), 1);
  const radiusFor = (count: number) => 10 + (count / maxListings) * 12;

  return (
    <div className="relative rounded-2xl border border-border bg-surface/40 p-4 sm:p-8">
      <div className="grid-bg absolute inset-0 opacity-20 rounded-2xl" />
      <svg
        viewBox="0 0 600 700"
        className="relative mx-auto w-full max-w-sm"
        role="img"
        aria-label="Map of Nigeria showing listing locations"
      >
        {/* Stylised landmass outline — decorative, not survey-accurate */}
        <path
          d="M180 60 C260 30 360 35 420 80 C470 110 500 160 490 220
             C520 260 540 320 510 380 C540 430 530 500 480 540
             C470 580 440 610 400 640 C380 670 340 690 300 685
             C260 690 220 665 200 630 C160 615 130 580 120 540
             C90 510 80 460 100 420 C80 370 90 310 130 270
             C110 220 130 160 170 120 C160 95 165 75 180 60 Z"
          className="fill-surface-elevated stroke-border"
          strokeWidth="2"
        />

        {plottable.map((loc) => {
          const pos = STATE_POSITIONS[loc.state];
          const r = radiusFor(loc.totalListings);
          const isHovered = hovered === loc.state;
          return (
            <g key={loc.state}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r + 8}
                className="fill-gold/10"
                opacity={isHovered ? 1 : 0}
              />
              <Link
                to="/divisions/real-estate/listings/$state"
                params={{ state: loc.state }}
                onMouseEnter={() => setHovered(loc.state)}
                onMouseLeave={() => setHovered(null)}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  className={isHovered ? "fill-gold" : "fill-gold/70"}
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: "var(--background)" }}
                />
                <text
                  x={pos.x}
                  y={pos.y + r + 18}
                  textAnchor="middle"
                  className="fill-foreground text-[13px] font-semibold"
                >
                  {loc.state === "FCT (Abuja)" ? "Abuja" : loc.state}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + r + 34}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px]"
                >
                  {loc.totalListings} listing{loc.totalListings === 1 ? "" : "s"}
                </text>
              </Link>
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-lg border border-gold/30 bg-background px-3 py-2 text-xs shadow-lg">
          <div className="flex items-center gap-1.5 font-semibold">
            <MapPin className="h-3 w-3 text-gold" /> {hovered}
          </div>
          <div className="mt-0.5 text-muted-foreground">
            {plottable.find((l) => l.state === hovered)?.forSale ?? 0} for sale ·{" "}
            {plottable.find((l) => l.state === hovered)?.forRent ?? 0} for rent
            {(plottable.find((l) => l.state === hovered)?.minPrice ?? 0) > 0 &&
              ` · from ${naira(plottable.find((l) => l.state === hovered)!.minPrice)}`}
          </div>
        </div>
      )}
    </div>
  );
}
