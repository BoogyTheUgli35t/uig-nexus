import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

/**
 * Rendered once at the app root. When no Supabase credentials could be
 * resolved, the app no longer crashes — it degrades, and this banner explains
 * why data and sign-in are unavailable. Checked after hydration so the server
 * and client render the same markup.
 */
export function BackendBanner() {
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    setConfigured(isSupabaseConfigured());
  }, []);

  if (configured) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-[100] flex items-center justify-center gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        Backend not configured — data and sign-in are unavailable until Lovable Cloud credentials
        are restored.
      </span>
    </div>
  );
}
