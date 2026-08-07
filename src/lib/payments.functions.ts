import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Creates a Stripe Checkout Session (sandbox when a test key is configured).
 * Uses the Stripe REST API directly via fetch so it runs on the edge runtime.
 */
const CheckoutSchema = z.object({
  productName: z.string().trim().min(1).max(200),
  /** Amount in major currency units (e.g. 50 = $50.00). */
  amount: z.coerce.number().positive().max(10_000_000),
  currency: z.string().trim().toLowerCase().length(3).default("usd"),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
  mode: z.enum(["payment", "subscription"]).default("payment"),
  /** Same-origin base URL used to build success/cancel redirects. */
  origin: z.string().trim().url().max(300),
});

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => CheckoutSchema.parse(i))
  .handler(async ({ data, context }) => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Payments are not configured. Missing STRIPE_SECRET_KEY.");

    const params = new URLSearchParams();
    params.set("mode", data.mode);
    params.set("success_url", `${data.origin}/portal/settings?checkout=success`);
    params.set("cancel_url", `${data.origin}/portal/settings?checkout=cancelled`);
    params.set("client_reference_id", context.userId);
    if (context.claims?.email) params.set("customer_email", String(context.claims.email));

    const recurring = data.mode === "subscription";
    params.set("line_items[0][price_data][currency]", data.currency);
    params.set("line_items[0][price_data][product_data][name]", data.productName);
    params.set("line_items[0][price_data][unit_amount]", String(Math.round(data.amount * 100)));
    if (recurring) params.set("line_items[0][price_data][recurring][interval]", "month");
    params.set("line_items[0][quantity]", String(data.quantity));

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const json = (await res.json()) as {
      id?: string;
      url?: string;
      livemode?: boolean;
      error?: { message?: string };
    };

    if (!res.ok || !json.url) {
      throw new Error(json.error?.message || `Stripe request failed (${res.status}).`);
    }

    return { url: json.url, sessionId: json.id, livemode: !!json.livemode };
  });
