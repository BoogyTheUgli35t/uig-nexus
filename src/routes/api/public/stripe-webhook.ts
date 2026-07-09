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
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ parts.v1.charCodeAt(i);
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

        const event = JSON.parse(body) as { type?: string; data?: { object?: unknown } };

        // Handle the events you care about here.
        switch (event.type) {
          case "checkout.session.completed":
            // e.g. mark an order/subscription as paid using client_reference_id
            break;
          default:
            break;
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
