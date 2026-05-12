-- ============================================================
-- Ascendr — fix ON CONFLICT target on payments.stripe_session_id
-- Apply after 02_payment_rpc.sql. Safe to re-run.
-- ============================================================
--
-- The previous migration created a *partial* unique index
-- (WHERE stripe_session_id IS NOT NULL), which Postgres won't accept as
-- an ON CONFLICT target unless the matching predicate is repeated on the
-- INSERT. Replacing it with a real UNIQUE constraint fixes apply_purchase()
-- and makes the idempotency contract explicit at the schema level.
--
-- Multiple NULLs are still allowed (Postgres default: NULLS DISTINCT).

drop index if exists public.payments_stripe_session_id_uniq;

alter table public.payments
  add constraint payments_stripe_session_id_uniq unique (stripe_session_id);
