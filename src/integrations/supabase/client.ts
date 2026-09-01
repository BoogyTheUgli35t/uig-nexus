// Based on the generated Lovable Cloud client, with two deliberate changes:
//  1. It falls back to the checked-in publishable config when the build did
//     not inject VITE_SUPABASE_* (this is what took preview + production down:
//     every page threw on module access).
//  2. When no credentials can be resolved at all it degrades instead of
//     throwing, so the app renders a "backend not configured" banner rather
//     than a dead page. The console error is still emitted.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";
import { FALLBACK_SUPABASE_URL, FALLBACK_SUPABASE_PUBLISHABLE_KEY } from "./public-config";

function readEnv(): { url?: string; key?: string } {
  // import.meta.env is replaced at build time for the browser bundle;
  // process.env covers SSR / the worker runtime.
  const env = typeof process !== "undefined" ? (process.env ?? {}) : {};
  return {
    url: import.meta.env.VITE_SUPABASE_URL || env.SUPABASE_URL || FALLBACK_SUPABASE_URL,
    key:
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      env.SUPABASE_PUBLISHABLE_KEY ||
      FALLBACK_SUPABASE_PUBLISHABLE_KEY,
  };
}

/** True when a URL + publishable key could be resolved. Used by the UI to show
 * a configuration banner instead of failing silently. */
export function isSupabaseConfigured(): boolean {
  const { url, key } = readEnv();
  return Boolean(url && key);
}

const NOT_CONFIGURED = {
  message: "Backend not configured. Connect Lovable Cloud to enable data and sign-in.",
  name: "SupabaseNotConfiguredError",
};

/** Stand-in client used only when no credentials exist: every call resolves to
 * an error result instead of throwing, so React trees stay mounted. */
function createUnconfiguredClient(): unknown {
  // Any property access returns this same callable proxy, and awaiting it
  // yields `{ data: null, error }` — so `supabase.from("x").select()` and
  // `supabase.auth.getUser()` both settle instead of blowing up.
  const target = function stub() {
    return proxy;
  } as unknown as Record<string, unknown>;
  const proxy: unknown = new Proxy(target, {
    get(_t, prop) {
      if (prop === "then") {
        return (onFulfilled: (v: unknown) => unknown) =>
          Promise.resolve({ data: null, error: NOT_CONFIGURED }).then(onFulfilled);
      }
      return proxy;
    },
    apply() {
      return proxy;
    },
  });
  return proxy;
}

function createSupabaseClient() {
  const { url, key } = readEnv();

  if (!url || !key) {
    const missing = [
      ...(!url ? ["SUPABASE_URL"] : []),
      ...(!key ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    console.error(
      `[Supabase] Missing Supabase environment variable(s): ${missing.join(", ")}. Connect Supabase in Lovable Cloud.`,
    );
    return null;
  }

  return createClient<Database>(url, key, {
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

type SupabaseClient = NonNullable<ReturnType<typeof createSupabaseClient>>;

let _supabase: SupabaseClient | undefined;

function resolveClient(): SupabaseClient {
  if (!_supabase) {
    _supabase = createSupabaseClient() ?? (createUnconfiguredClient() as unknown as SupabaseClient);
  }
  return _supabase;
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop, receiver) {
    return Reflect.get(resolveClient(), prop, receiver);
  },
});
