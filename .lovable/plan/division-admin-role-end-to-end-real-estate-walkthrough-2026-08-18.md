# Division Admin Role + End-to-End Real Estate Walkthrough

Two pieces of work: (1) verify the full user journey actually works end to end, (2) add a per-division admin role so your team can manage people inside their own division.

## Part 1 — Verify the journey

Drive the real app in a headless browser and fix anything that breaks along the way:

1. Sign in
2. Choose divisions (onboarding)
3. Create a property
4. Upload a document to that property
5. Edit the property
6. Delete the document, then the property

Any failure found (broken route, missing delete action, storage permission error) gets fixed in the same pass. Today there is no delete action on properties or units in the portal — that will be added with a confirmation dialog and cascade-safe checks (block deleting a property that still has units/tenants, with a clear message).

## Part 2 — Division admin role

Based on your answers:

- Applies to **all six divisions**, not just Real Estate.
- **Members keep full record editing** — nothing they can do today is taken away.
- **Division admins additionally manage people**: grant/revoke access to their own division, see who is in it, and approve access requests scoped to that division.
- **Only global admins** can appoint or remove a division admin.

### What changes for users

- Global admin panel gains a "Division access" screen: search a user, toggle which divisions they belong to, and mark them as admin of a division.
- A division admin sees a new "Team" tab inside their division workspace listing members, with add/remove and pending access requests for that division only.
- Ordinary members do not see the Team tab.

## Technical notes

- New table `public.division_admins (user_id, division_slug)`, unique per pair, with GRANTs, RLS, and a `private.is_division_admin(uid, slug)` security-definer helper.
- Only global admins can write to `division_admins` (RLS), matching your answer on who assigns.
- `user_divisions` policies extended: division admins may insert/delete rows **only** for their own division slug; global admin policy stays as-is.
- `access_requests`: division admins can read and resolve requests whose requested division matches one they administer.
- `getMyWorkspace` returns `divisionAdminOf: string[]`; a `useIsDivisionAdmin(slug)` hook gates the Team tab.
- New `src/lib/division-team.functions.ts` (auth-middleware, RLS-scoped): `listDivisionMembers`, `grantDivisionAccess`, `revokeDivisionAccess`, `listDivisionAccessRequests`, `resolveAccessRequest`. Server side re-checks the caller administers the target slug — the route guard is UX only.
- New route `src/routes/_apex.portal.divisions.<slug>.team.tsx` per division (shared component), plus an admin screen at `/portal/admin/division-access`.
- Record-record deletes for properties/units reuse existing `realestate-crud.functions.ts` patterns with new `deleteProperty` / `deleteUnit` functions.
- All member/team actions are written to `portal_audit_log` so they show up in the existing audit viewer.
