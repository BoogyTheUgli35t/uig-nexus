import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Unauthenticated intake for the public "submit an idea" form. Runs as the
// Supabase `anon` role, which 20260714140000_public_innovation_submissions.sql
// grants INSERT-only access on innovation_submissions (no read-back — a
// submitter can't see anyone else's idea, including their own after posting).

const SubmitPublicIdeaSchema = z.object({
  full_name: z.string().trim().min(1).max(150),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  idea_title: z.string().trim().min(1).max(180),
  idea_description: z.string().trim().min(1).max(3000),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  // Honeypot: a real visitor never fills this hidden field. Bots that
  // blind-fill every input on the page will, so silently drop the
  // submission (return success) rather than surfacing a validation error
  // that would teach the bot what to avoid.
  website: z.string().max(0).optional().or(z.literal("")),
});

export const submitPublicIdea = createServerFn({ method: "POST" })
  .validator((i: unknown) => SubmitPublicIdeaSchema.parse(i))
  .handler(async ({ data }) => {
    if (data.website) return { ok: true };

    const { error } = await supabase.from("innovation_submissions").insert({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      idea_title: data.idea_title,
      idea_description: data.idea_description,
      category: data.category || null,
      status: "new",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
