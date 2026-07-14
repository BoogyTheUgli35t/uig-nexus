import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "@/integrations/supabase/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves a gallery image reference to a renderable URL.
 *
 * Most `*_images.storage_path` rows are keys inside a Supabase Storage bucket
 * and need `getPublicUrl()`. Seeded/curated rows (e.g. the Real Estate photo
 * library) instead store a full external URL directly — in that case we
 * render it as-is rather than mangling it through the storage resolver.
 */
export function resolveImageUrl(bucket: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
