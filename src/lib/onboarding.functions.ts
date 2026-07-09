import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DIVISION_SLUGS = [
  "technology",
  "agritech",
  "real-estate",
  "logistics",
  "intelligence",
  "innovation-lab",
] as const;

const ChooseDivisionsSchema = z.object({
  divisions: z.array(z.enum(DIVISION_SLUGS)).min(1).max(DIVISION_SLUGS.length),
  primary: z.enum(DIVISION_SLUGS).optional(),
});

/**
 * Records the divisions a user picked during onboarding and their primary
 * workspace. Idempotent: safe to call again if the user revisits onboarding.
 */
export const chooseDivisions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ChooseDivisionsSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // De-duplicate and resolve the primary workspace.
    const unique = Array.from(new Set(data.divisions));
    const primary = data.primary && unique.includes(data.primary) ? data.primary : unique[0];

    // Replace the user's division access with the current selection.
    const { error: delError } = await supabase
      .from("user_divisions")
      .delete()
      .eq("user_id", userId);
    if (delError) throw new Error(delError.message);

    const { error: insError } = await supabase
      .from("user_divisions")
      .insert(unique.map((division_slug) => ({ user_id: userId, division_slug })));
    if (insError) throw new Error(insError.message);

    // Persist onboarding completion + primary workspace.
    const { error: prefError } = await supabase.from("user_preferences").upsert(
      {
        user_id: userId,
        primary_division: primary,
        division_selection_completed: true,
      },
      { onConflict: "user_id" },
    );
    if (prefError) throw new Error(prefError.message);

    return { ok: true, primary, divisions: unique };
  });

/** Where a signed-in user should land: dashboard, or onboarding if never done. */
export const getOnboardingState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: prefs }, { data: divisions }] = await Promise.all([
      supabase
        .from("user_preferences")
        .select("division_selection_completed, primary_division")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("user_divisions").select("division_slug").eq("user_id", userId),
    ]);
    const hasDivisions = (divisions ?? []).length > 0;
    const completed = Boolean(prefs?.division_selection_completed) || hasDivisions;
    return {
      completed,
      primary: prefs?.primary_division ?? (divisions?.[0]?.division_slug ?? null),
      hasDivisions,
    };
  });
