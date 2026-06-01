import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the Authorization header for the current session so server functions
 * protected by `requireSupabaseAuth` receive the user's bearer token.
 * Returns an empty object when there is no active session.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { authorization: `Bearer ${token}` } : {};
}
