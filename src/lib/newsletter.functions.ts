import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const NewsletterSchema = z.object({
  email: z.string().trim().email().max(255),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => NewsletterSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .insert({ email: data.email });
    // Duplicate signups (unique email) shouldn't surface as an error to the user.
    if (error && error.code !== "23505") throw new Error(error.message);
    return { ok: true };
  });
