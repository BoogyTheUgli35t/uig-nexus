import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getStripe } from "@/integrations/stripe/client.server";
import { rentInstalmentKobo, ASSET_RESERVATION_KOBO } from "@/lib/portal-payments";

const OriginSchema = z.object({ origin: z.string().url() });

async function startCheckout(
  supabase: any,
  userId: string,
  opts: {
    description: string;
    amount_kobo: number;
    related_table: string;
    related_id: string;
    origin: string;
    returnPath: string;
  },
) {
  const stripe = getStripe();
  const { data: row, error } = await supabase
    .from("billing_transactions")
    .insert({
      description: opts.description,
      amount_kobo: opts.amount_kobo,
      currency: "ngn",
      division: "real-estate",
      related_table: opts.related_table,
      related_id: opts.related_id,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "ngn",
          unit_amount: opts.amount_kobo,
          product_data: { name: opts.description },
        },
        quantity: 1,
      },
    ],
    success_url: `${opts.origin}${opts.returnPath}?paid=1`,
    cancel_url: `${opts.origin}${opts.returnPath}?canceled=1`,
    metadata: { transaction_id: row.id },
  });
  await supabase
    .from("billing_transactions")
    .update({ stripe_session_id: session.id })
    .eq("id", row.id);
  if (!session.url) throw new Error("Stripe didn't return a checkout URL.");
  return { url: session.url };
}

/** Tenant pays one month of rent. Amount always comes from their lease record. */
export const payMyRent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => OriginSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { data: tenant, error } = await context.supabase
      .from("tenants")
      .select("id, rent_amount")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!tenant) throw new Error("No tenancy is linked to your account.");
    const amount = rentInstalmentKobo(Number(tenant.rent_amount));
    if (amount <= 0) throw new Error("Your lease has no rent amount set yet.");
    return startCheckout(context.supabase, context.userId, {
      description: "Monthly rent instalment",
      amount_kobo: amount,
      related_table: "tenants",
      related_id: tenant.id,
      origin: data.origin,
      returnPath: "/portal/my-tenancy",
    });
  });

/** Properties investors can reserve. */
export const listInvestableAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("properties")
      .select("id, title, city, state, price, property_type")
      .eq("listing_type", "sale")
      .neq("status", "sold")
      .order("price", { ascending: false })
      .limit(12);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Investor reserves an asset with a fixed reservation deposit. */
export const reserveAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    OriginSchema.extend({ property_id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { data: inv } = await context.supabase
      .from("investors")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!inv) throw new Error("No investor profile is linked to your account.");
    const { data: prop, error } = await context.supabase
      .from("properties")
      .select("id, title")
      .eq("id", data.property_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!prop) throw new Error("Property not found.");
    return startCheckout(context.supabase, context.userId, {
      description: `Reservation deposit — ${prop.title}`,
      amount_kobo: ASSET_RESERVATION_KOBO,
      related_table: "properties",
      related_id: prop.id,
      origin: data.origin,
      returnPath: "/portal/my-investments",
    });
  });
