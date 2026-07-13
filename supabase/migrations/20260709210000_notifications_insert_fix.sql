-- The original notifications INSERT policy only allowed staff/admin to notify
-- someone else (or anyone to notify themselves). That silently blocked the new
-- best-effort notifications added this session — e.g. a driver (role 'driver',
-- not 'staff') completing a delivery can't notify the shipment's owner_id, and a
-- client-role real-estate agent closing a deal can't notify the lead owner.
--
-- Notifications are low-sensitivity (informational only) and this portal has no
-- open signup — every account is admin-approved — so broadening insert to any
-- authenticated user is a reasonable trade. Recipients still only ever *read*
-- their own notifications (see "users read own notifications"), so this only
-- affects who's allowed to create one, not who can see one.
DROP POLICY IF EXISTS "staff admins insert notifications" ON public.notifications;

CREATE POLICY "authenticated users insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);
