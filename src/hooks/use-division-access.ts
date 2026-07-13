import { useEffect, useState } from "react";
import { getMyWorkspace } from "@/lib/divisions.functions";
import { authHeaders } from "@/lib/auth-headers";
import type { DivisionSlug } from "@/lib/divisions";

/**
 * Whether the current user can access a given division workspace (admin, or has an
 * explicit user_divisions grant). `null` while the check is in flight.
 */
export function useDivisionAccess(slug: DivisionSlug): boolean | null {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const ws = await getMyWorkspace({ headers: await authHeaders() });
        if (active) setHasAccess(ws.isAdmin || ws.divisionSlugs.includes(slug));
      } catch {
        if (active) setHasAccess(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  return hasAccess;
}
