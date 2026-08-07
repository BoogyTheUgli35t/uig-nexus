import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getStripe, isStripeConfigured } from "@/integrations/stripe/client.server";

export const paymentsConfigured = createServerFn({ method: "GET" }).handler(async () => ({
  configured: isStripeConfigured(),
}));

export const listMyBilling = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("billing_transactions")
      .select(
        "id, description, amount_kobo, currency, division, status, related_table, related_id, created_at, paid_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const CreateCheckoutSchema = z.object({
  description: z.string().trim().min(1).max(200),
  amount_kobo: z.number().int().positive(),
  currency: z.string().trim().length(3).default("ngn"),
  division: z.string().nullable().optional(),
  related_table: z.string().optional(),
  related_id: z.string().uuid().optional(),
  origin: z.string().url(),
});

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => CreateCheckoutSchema.parse(i))
  .handler(async ({ context, data }) => {
    const stripe = getStripe(); // throws a clear "not configured" error if no key

    const { data: row, error } = await context.supabase
      .from("billing_transactions")
      .insert({
        description: data.description,
        amount_kobo: data.amount_kobo,
        currency: data.currency,
        division: data.division ?? null,
        related_table: data.related_table ?? null,
        related_id: data.related_id ?? null,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: data.currency,
            unit_amount: data.amount_kobo,
            product_data: { name: data.description },
          },
          quantity: 1,
        },
      ],
      success_url: `${data.origin}/portal/billing?paid=1`,
      cancel_url: `${data.origin}/portal/billing?canceled=1`,
      metadata: { transaction_id: row.id },
    });

    const { error: updErr } = await context.supabase
      .from("billing_transactions")
      .update({ stripe_session_id: session.id })
      .eq("id", row.id);
    if (updErr) throw new Error(updErr.message);

    if (!session.url) throw new Error("Stripe didn't return a checkout URL.");
    return { url: session.url };
  });
