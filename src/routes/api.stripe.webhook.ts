import { createFileRoute } from "@tanstack/react-router";
import { getStripe } from "@/integrations/stripe/client.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
          console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not configured");
          return new Response("Webhook not configured", { status: 500 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });

        const rawBody = await request.text();

        let event;
        try {
          const stripe = getStripe();
          event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        } catch (err) {
          console.error("[stripe webhook] signature verification failed", err);
          return new Response("Invalid signature", { status: 400 });
        }

        if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
          const session = event.data.object as { id: string; payment_intent?: string | null; metadata?: Record<string, string> | null };
          const transactionId = session.metadata?.transaction_id;
          const update = {
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_payment_intent: session.payment_intent ?? null,
          };
          if (transactionId) {
            await supabaseAdmin.from("billing_transactions").update(update).eq("id", transactionId);
          } else {
            await supabaseAdmin.from("billing_transactions").update(update).eq("stripe_session_id", session.id);
          }
        }

        if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
          const session = event.data.object as { id: string; metadata?: Record<string, string> | null };
          const transactionId = session.metadata?.transaction_id;
          if (transactionId) {
            await supabaseAdmin.from("billing_transactions").update({ status: "failed" }).eq("id", transactionId);
          } else {
            await supabaseAdmin
              .from("billing_transactions")
              .update({ status: "failed" })
              .eq("stripe_session_id", session.id);
          }
        }

        return new Response(JSON.stringify({ received: true }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
