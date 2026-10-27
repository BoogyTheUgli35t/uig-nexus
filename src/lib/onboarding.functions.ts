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

/** Fixed so the "have we already welcomed this account?" check can match on it. */
const WELCOME_TITLE = "Welcome to UIG Apex";

const DIVISION_LABELS: Record<(typeof DIVISION_SLUGS)[number], string> = {
  technology: "Technology",
  agritech: "AgriTech",
  "real-estate": "Real Estate",
  logistics: "Logistics",
  intelligence: "Intelligence",
  "innovation-lab": "Innovation Lab",
};

/**
 * Records the divisions a user picked during onboarding and their primary
 * workspace. Idempotent: safe to call again if the user revisits onboarding.
 *
 * There used to be a second function doing roughly this (`registerUserDivisions`
 * in portal.functions.ts) with no caller — two write paths to `user_divisions`,
 * one of which never set `division_selection_completed`, so a user who
 * happened to hit it would be sent back through onboarding forever. It has
 * been removed; the one thing it did that this didn't — welcoming the new
 * account — moved here.
 */
export const chooseDivisions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ChooseDivisionsSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // De-duplicate and resolve the primary workspace.
    const unique = Array.from(new Set(data.divisions));
    const primary = data.primary && unique.includes(data.primary) ? data.primary : unique[0];

    // Replace the user's division access with the current selection.
    // Uses admin client because RLS on user_divisions is admin-manage-only
    // (self-service manage was removed to close a privilege-escalation hole).
    // Server-side, this is safe: we scope every write to the authenticated userId.
    const { error: delError } = await supabaseAdmin
      .from("user_divisions")
      .delete()
      .eq("user_id", userId);
    if (delError) throw new Error(delError.message);

    const { error: insError } = await supabaseAdmin
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

    // Welcome the account into its new workspaces. Best-effort by design: a
    // failed notification must never block someone from finishing onboarding,
    // and the row is skipped entirely if one already exists so revisiting the
    // division picker doesn't send the same greeting twice.
    const { data: alreadyWelcomed } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("title", WELCOME_TITLE)
      .limit(1);

    if ((alreadyWelcomed ?? []).length === 0) {
      const names = unique.map((slug) => DIVISION_LABELS[slug]);
      const list =
        names.length === 1
          ? names[0]
          : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
      await supabase.from("notifications").insert({
        user_id: userId,
        title: WELCOME_TITLE,
        body: `Your ${list} workspace${names.length > 1 ? "s are" : " is"} ready. Everything you need is in the sidebar.`,
        division: primary,
      });
    }

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
      primary: prefs?.primary_division ?? divisions?.[0]?.division_slug ?? null,
      hasDivisions,
    };
  });
