import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Division } from "@/lib/divisions";

/** Full-width hero banner with a division background image + accent overlay. */
export function HeroBanner({
  division,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  division?: Division;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  const Icon = division?.icon;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border",
        division?.accentClass,
      )}
    >
      {division?.hero && (
        <img
          src={division.hero}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/65 to-background/15" />
      <div className="relative p-6 sm:p-10">
        {eyebrow && (
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] acc-text">
            {Icon && <Icon className="h-4 w-4" />}
            {eyebrow}
          </div>
        )}
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-muted-foreground">{subtitle}</p>}
        {children && <div className="mt-5">{children}</div>}
      </div>
    </div>
  );
}

/** Compact KPI card. */
export function KpiStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="h-4 w-4 acc-text" />}
        {label}
      </div>
      <div className="mt-2 text-3xl font-display font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** Bordered panel with title + optional link header. */
export function DataPanel({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: { to: string; label: string } | ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-6", className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        {action && typeof action === "object" && "to" in action ? (
          <Link to={action.to} className="text-sm text-gold hover:underline">
            {action.label}
          </Link>
        ) : (
          action
        )}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** Friendly empty-state placeholder. */
export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
      {Icon && <Icon className="h-7 w-7 text-muted-foreground" />}
      <p className="mt-3 text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  live: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  soon: "bg-muted text-muted-foreground border-border",
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  planning: "bg-gold/15 text-gold border-gold/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  todo: "bg-muted text-muted-foreground border-border",
  done: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  discovery: "bg-gold/15 text-gold border-gold/30",
  building: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  review: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  paused: "bg-muted text-muted-foreground border-border",
  connected: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  error: "bg-destructive/15 text-destructive border-destructive/30",
  disconnected: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize",
        STATUS_STYLES[key] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

/** Module card used on division landing pages. */
export function ModuleCard({
  icon: Icon,
  label,
  description,
  status,
  to,
}: {
  icon?: LucideIcon;
  label: string;
  description: string;
  status?: string;
  to?: string;
}) {
  const content = (
    <div className="group h-full rounded-xl border border-border bg-surface p-5 transition hover:acc-border-soft">
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg acc-bg-soft acc-text">
          {Icon && <Icon className="h-4.5 w-4.5" />}
        </div>
        {status && <StatusBadge status={status} />}
      </div>
      <h4 className="mt-4 font-semibold">{label}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {to && (
        <div className="mt-3 inline-flex items-center gap-1 text-sm acc-text opacity-0 transition group-hover:opacity-100">
          Open <ArrowRight className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
  return content;
}
