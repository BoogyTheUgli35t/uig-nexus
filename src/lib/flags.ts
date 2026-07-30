/**
 * Feature flags — environment-driven, evaluated at build time.
 *
 * Deliberately not a database table: these gate whether a surface is exposed at
 * all (the Phase 6 "release behind a flag" step), so they must be knowable
 * without a network round-trip and must not be flippable by anyone with
 * database access alone. Per-user or per-tenant toggles belong in
 * `user_divisions` / roles, not here.
 *
 * Set in the deploy environment as `VITE_FLAG_<NAME>=off` to disable. Anything
 * other than "off"/"false"/"0" (including unset) means enabled, so a typo fails
 * safe toward the shipped experience rather than silently hiding a division.
 */

function readFlag(name: string, fallback = true): boolean {
  const raw = import.meta.env[`VITE_FLAG_${name}` as keyof ImportMetaEnv] as string | undefined;
  if (raw === undefined || raw === "") return fallback;
  return !["off", "false", "0", "no"].includes(String(raw).toLowerCase());
}

export const FLAGS = {
  /** Public real-estate listings browse experience (/divisions/real-estate/listings). */
  realEstateListings: readFlag("REAL_ESTATE_LISTINGS"),
  /** Public Innovation Lab idea intake form. */
  innovationIntake: readFlag("INNOVATION_INTAKE"),
  /** Public system status page. */
  statusPage: readFlag("STATUS_PAGE"),
  /** Portal self-service signup (vs. invite/access-request only). */
  selfServeSignup: readFlag("SELF_SERVE_SIGNUP"),
  // Note: there is deliberately no `payments` flag. Checkout is already gated
  // at runtime by whether STRIPE_SECRET_KEY is configured
  // (paymentsConfigured() in billing.functions.ts), which is strictly better
  // than a build-time flag — it can't drift out of sync with whether payments
  // actually work. A second switch would just be a way to lie about it.
} as const;

export type FeatureFlag = keyof typeof FLAGS;

export function isEnabled(flag: FeatureFlag): boolean {
  return FLAGS[flag];
}
