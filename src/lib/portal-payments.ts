/** Stripe's per-charge ceiling for NGN is 99,999,999 kobo (just under ₦1M). */
export const STRIPE_MAX_KOBO = 99_999_999;

/** Fixed deposit an investor pays to reserve an asset: ₦500,000. */
export const ASSET_RESERVATION_KOBO = 500_000 * 100;

/** Leases store annual rent in naira; tenants pay one month at a time, capped at Stripe's limit. */
export function rentInstalmentKobo(annualRentNaira: number): number {
  if (!Number.isFinite(annualRentNaira) || annualRentNaira <= 0) return 0;
  return Math.min(Math.round((annualRentNaira / 12) * 100), STRIPE_MAX_KOBO);
}
