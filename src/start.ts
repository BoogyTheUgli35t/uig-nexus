import { createStart } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

// Attaches the Supabase bearer token to every server-function RPC so that
// functions guarded by `requireSupabaseAuth` receive the signed-in user.
export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
}));
