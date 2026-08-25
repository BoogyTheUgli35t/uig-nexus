import { useQuery } from "@tanstack/react-query";
import { getMyWorkspace } from "@/lib/divisions.functions";
import { authHeaders } from "@/lib/auth-headers";
import type { DivisionSlug } from "@/lib/divisions";

type Access = { hasAccess: boolean; isDivisionAdmin: boolean };

/**
 * Whether the current user can access a given division workspace (admin, or has an
 * explicit user_divisions grant), and whether they administer it.
 * `null` while the check is in flight.
 *
 * Uses react-query so a transient failure (e.g. the auth token not being ready on
 * first paint) is retried instead of latching "no access" for the whole session.
 */
export function useDivisionWorkspaceAccess(slug: DivisionSlug): Access | null {
  const { data } = useQuery({
    queryKey: ["my-workspace-access"],
    queryFn: async () => getMyWorkspace({ headers: await authHeaders() }),
    retry: 2,
    staleTime: 30_000,
  });

  if (!data) return null;
  return {
    hasAccess: data.isAdmin || data.divisionSlugs.includes(slug),
    isDivisionAdmin: data.isAdmin || (data.divisionAdminOf ?? []).includes(slug),
  };
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
