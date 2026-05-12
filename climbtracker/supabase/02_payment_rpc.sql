-- ============================================================
-- Ascendr — atomic payment application
-- Apply after 01_security_fixes.sql. Safe to re-run.
-- ============================================================

-- ── M2: add purchase_type so we stop overloading the `tier` column ───────────
-- `tier` stays for backwards compatibility but now holds the Stripe tier value
-- only when relevant (standard/premium for base_plan; the type name otherwise
-- — fine for the legacy rows). `purchase_type` is the canonical discriminator.
alter table public.payments
  add column if not exists purchase_type text
    check (purchase_type in ('base_plan', 'bundle', 'upgrade'));

create index if not exists payments_purchase_type_idx
  on public.payments(purchase_type);


-- ── M1: apply_purchase RPC ───────────────────────────────────────────────────
-- Wraps "record payment row + mutate competition" in a single transaction.
-- The webhook used to do this in two separate write calls with best-effort
-- rollback on failure; that left the door open to half-applied state if the
-- function died between writes. Postgres rolls the whole function back on
-- any raised exception, so this is atomic.
--
-- Returns one of: 'applied' | 'duplicate' | 'not_found'
-- Raises on bad input so the webhook surfaces 4xx instead of partial state.
--
-- SECURITY DEFINER + locked search_path: the webhook calls this through the
-- service-role key and we want the function to use the public schema only.

create or replace function public.apply_purchase(
  p_competition_id   text,
  p_user_id          uuid,
  p_session_id       text,
  p_payment_intent   text,
  p_amount_cents     integer,
  p_currency         text,
  p_purchase_type    text,
  p_tier             text,
  p_participant_count integer,
  p_slots            integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_id  uuid;
  v_data        jsonb;
  v_updated     jsonb;
  v_base_limit  integer;
begin
  -- ── Validate purchase type up front ──────────────────────────────────────
  if p_purchase_type not in ('base_plan', 'bundle', 'upgrade') then
    raise exception 'invalid purchase_type: %', p_purchase_type
      using errcode = '22023';
  end if;

  -- ── Idempotent insert: duplicate webhook delivery → no-op ────────────────
  insert into public.payments (
    competition_id,
    user_id,
    stripe_session_id,
    stripe_payment_id,
    amount_cents,
    currency,
    status,
    tier,
    purchase_type,
    participant_limit
  )
  values (
    p_competition_id,
    p_user_id,
    p_session_id,
    p_payment_intent,
    p_amount_cents,
    coalesce(p_currency, 'eur'),
    'paid',
    coalesce(p_tier, p_purchase_type),
    p_purchase_type,
    coalesce(p_participant_count, 0)
  )
  on conflict (stripe_session_id) do nothing
  returning id into v_payment_id;

  if v_payment_id is null then
    return 'duplicate';
  end if;

  -- ── Apply the purchase to the competition ────────────────────────────────
  select data into v_data
  from public.competitions
  where id = p_competition_id
  for update;

  if v_data is null then
    -- Roll back the payment insert by raising — Postgres will undo the row.
    raise exception 'competition_not_found' using errcode = 'P0002';
  end if;

  if p_purchase_type = 'base_plan' then
    v_base_limit := case when p_tier = 'premium' then 500 else 300 end;
    v_updated := v_data
      || jsonb_build_object(
           'status',           'LIVE',
           'subscription',     p_tier,
           'tier',             p_tier,
           'participantLimit', coalesce(p_participant_count, v_base_limit)
         );

  elsif p_purchase_type = 'bundle' then
    v_updated := v_data
      || jsonb_build_object(
           'additionalCapacity',
           coalesce((v_data->>'additionalCapacity')::int, 0) + coalesce(p_slots, 0)
         );

  else -- upgrade
    v_updated := v_data
      || jsonb_build_object(
           'subscription', 'premium',
           'tier',         'premium'
         );
  end if;

  update public.competitions
  set
    data       = v_updated,
    status     = coalesce(v_updated->>'status',     status),
    visibility = coalesce(v_updated->>'visibility', visibility)
  where id = p_competition_id;

  return 'applied';

exception
  when sqlstate 'P0002' then
    -- Competition not found: re-raise so the webhook returns a 404-class error.
    raise;
end;
$$;

-- Only the service role should be able to call this — the webhook runs with
-- the service-role key, so it works. Block public/authenticated by default.
revoke all on function public.apply_purchase(
  text, uuid, text, text, integer, text, text, text, integer, integer
) from public, anon, authenticated;
