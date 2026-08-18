import { useEffect, useState } from "react";
import { getMyWorkspace } from "@/lib/divisions.functions";
import { authHeaders } from "@/lib/auth-headers";
import type { DivisionSlug } from "@/lib/divisions";

type Access = { hasAccess: boolean; isDivisionAdmin: boolean };

/**
 * Whether the current user can access a given division workspace (admin, or has an
 * explicit user_divisions grant), and whether they administer it.
 * `null` while the check is in flight.
 */
export function useDivisionWorkspaceAccess(slug: DivisionSlug): Access | null {
  const [state, setState] = useState<Access | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const ws = await getMyWorkspace({ headers: await authHeaders() });
        if (!active) return;
        setState({
          hasAccess: ws.isAdmin || ws.divisionSlugs.includes(slug),
          isDivisionAdmin: ws.isAdmin || (ws.divisionAdminOf ?? []).includes(slug),
        });
      } catch {
        if (active) setState({ hasAccess: false, isDivisionAdmin: false });
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  return state;
}

/** Backwards-compatible boolean access check. */
export function useDivisionAccess(slug: DivisionSlug): boolean | null {
  const state = useDivisionWorkspaceAccess(slug);
  return state === null ? null : state.hasAccess;
}

/** Whether the current user administers the given division. */
export function useIsDivisionAdmin(slug: DivisionSlug): boolean {
  const state = useDivisionWorkspaceAccess(slug);
  return state?.isDivisionAdmin ?? false;
}
