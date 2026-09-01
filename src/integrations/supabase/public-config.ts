// Publishable Supabase connection details.
//
// These two values are client-visible by design: the URL is public and the
// publishable ("anon") key only ever gets the `anon` role, which is gated by
// Row Level Security. They are checked in on purpose so the browser bundle
// keeps working even when the build environment does not inject
// VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY (which is exactly what
// broke preview and production).
//
// NEVER put SUPABASE_SERVICE_ROLE_KEY (or any secret) in this file — it is
// bundled into the browser. Server-only credentials live in
// client.server.ts, read from process.env inside server code.

export const FALLBACK_SUPABASE_URL = "https://djocumwhwbncrpbnsfsy.supabase.co";

export const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqb2N1bXdod2JuY3JwYm5zZnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzAwNDUsImV4cCI6MjA5MzUwNjA0NX0.8_6lQ30G87o4Im_4Ph_zqE-vPILaiUemDduSYQNrTV8";
