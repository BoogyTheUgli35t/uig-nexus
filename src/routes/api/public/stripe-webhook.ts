import { createFileRoute } from "@tanstack/react-router";

/**
 * Stripe webhook receiver (public endpoint — verifies Stripe's signature).
 * Configure the endpoint URL + signing secret in the Stripe Dashboard
 * (Developers → Webhooks) and store the secret as STRIPE_WEBHOOK_SECRET.
 */
async function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k, v];
    }),
  ) as { t?: string; v1?: string };
  if (!parts.t || !parts.v1) return false;

  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(`${parts.t}.${payload}`));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // constant-time compare
  if (expected.length !== parts.v1.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++)
    mismatch |= expected.charCodeAt(i) ^ parts.v1.charCodeAt(i);
  return mismatch === 0;
}

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) {
          return new Response("Webhook secret not configured", { status: 503 });
        }
        const signature = request.headers.get("stripe-signature");
        const body = await request.text();
        if (!signature || !(await verifyStripeSignature(body, signature, secret))) {
          return new Response("Invalid signature", { status: 401 });
        }

        const event = JSON.parse(body) as {
          type?: string;
          data?: {
            object?: {
              id?: string;
              payment_status?: string;
              payment_intent?: string | null;
              metadata?: Record<string, string>;
            };
          };
        };
        const obj = event.data?.object ?? {};
        const txId = obj.metadata?.transaction_id;

        if (txId && event.type?.startsWith("checkout.session.")) {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const paid =
            (event.type === "checkout.session.completed" && obj.payment_status === "paid") ||
            event.type === "checkout.session.async_payment_succeeded";
          const failed =
            event.type === "checkout.session.async_payment_failed" ||
            event.type === "checkout.session.expired";

          if (paid || failed) {
            const { data: tx } = await supabaseAdmin
              .from("billing_transactions")
              .update(
                paid
                  ? {
                      status: "paid",
                      paid_at: new Date().toISOString(),
                      stripe_payment_intent: obj.payment_intent ?? null,
                    }
                  : { status: "failed" },
              )
              .eq("id", txId)
              .select("related_table, related_id")
              .maybeSingle();

            // Rent paid → the tenant's record shows as paid in the portal.
            if (paid && tx?.related_table === "tenants" && tx.related_id) {
              await supabaseAdmin
                .from("tenants")
                .update({ payment_status: "paid" })
                .eq("id", tx.related_id);
            }
          }
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
