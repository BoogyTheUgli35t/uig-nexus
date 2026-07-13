// Server-only Stripe client. Mirrors the soft-fail pattern used for the
// Lovable AI Gateway: no key configured -> a clear thrown error, never a
// silently-fake "connected" state. Set STRIPE_SECRET_KEY (and
// STRIPE_WEBHOOK_SECRET for the webhook route) in your environment to
// activate real Stripe Checkout. A `sk_test_...` key runs entirely in
// Stripe's sandbox — no real money moves until you switch to a live key.
import Stripe from "stripe";

let _stripe: Stripe | undefined;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Payments aren't configured yet. Set STRIPE_SECRET_KEY (a Stripe test key works fine) to enable checkout.",
    );
  }
  if (!_stripe) {
    _stripe = new Stripe(key, { apiVersion: "2025-08-27.basil" });
  }
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
