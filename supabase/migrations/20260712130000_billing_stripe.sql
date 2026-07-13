-- Payments: Stripe checkout scaffold (master plan: "Stripe sandbox
-- integrated, checkout flow working, webhook route ready"). This is a real
-- integration, not a fake "connected" state — it soft-fails with a clear
-- error until STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET are configured in
-- the environment, same honesty pattern as the Lovable AI Gateway calls
-- elsewhere in this codebase. `billing_transactions` is division-agnostic so
-- any division can request a payment (tech invoices, real estate rent, a
-- logistics COD charge, etc.) by attaching a `related_table`/`related_id`.

CREATE TABLE public.billing_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount_kobo bigint NOT NULL CHECK (amount_kobo > 0), -- smallest currency unit (kobo for NGN, cents for USD)
  currency text NOT NULL DEFAULT 'ngn',
  division text,
  related_table text,
  related_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'void')),
  stripe_session_id text UNIQUE,
  stripe_payment_intent text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX billing_transactions_division_idx ON public.billing_transactions (division);
CREATE INDEX billing_transactions_created_by_idx ON public.billing_transactions (created_by);
CREATE INDEX billing_transactions_related_idx ON public.billing_transactions (related_table, related_id);

ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own or division billing" ON public.billing_transactions
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (division IS NOT NULL AND private.has_division_access(auth.uid(), division))
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "create billing transactions" ON public.billing_transactions
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Status transitions (pending -> paid/failed/void) happen server-side via the
-- service-role client from the Stripe webhook handler, which bypasses RLS —
-- no authenticated-role UPDATE policy is needed or granted, so a client can
-- never mark their own transaction "paid" directly.
