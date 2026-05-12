-- ============================================================
-- Ascendr — Security hardening migration
-- Apply on top of the existing schema.sql in Supabase SQL Editor.
-- Safe to re-run: only drops/recreates policies, triggers, and adds
-- a unique constraint. No table data is touched.
-- ============================================================

-- ── competitions: replace open authenticated_read with visibility check ──────
drop policy if exists "authenticated_read" on public.competitions;
drop policy if exists "owner_all"          on public.competitions;

-- Public competitions are visible to everyone signed in.
-- Private competitions are visible only to owner or active members.
create policy "competitions_select" on public.competitions
  for select using (
    visibility = 'public'
    or owner_id = auth.uid()
    or exists (
      select 1 from public.competition_members cm
      where cm.competition_id = competitions.id
        and cm.user_id        = auth.uid()
        and cm.status         = 'active'
    )
  );

-- Only the owner may insert/update/delete competitions.
-- WITH CHECK locks owner_id so a competition can't be transferred to another user.
create policy "competitions_insert" on public.competitions
  for insert with check (owner_id = auth.uid());

create policy "competitions_update" on public.competitions
  for update using (owner_id = auth.uid())
              with check (owner_id = auth.uid());

create policy "competitions_delete" on public.competitions
  for delete using (owner_id = auth.uid());


-- ── competition_members: tighten read + insert ──────────────────────────────
drop policy if exists "member_read"        on public.competition_members;
drop policy if exists "organizer_insert"   on public.competition_members;

-- READ: own membership, members of the same competition you belong to,
--       or members of any competition you own.
-- Uses a SECURITY DEFINER helper to avoid RLS recursion.
create or replace function public.is_member_of(comp_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.competition_members
    where competition_id = comp_id
      and user_id        = auth.uid()
      and status         = 'active'
  );
$$;

create or replace function public.is_owner_of(comp_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.competitions
    where id       = comp_id
      and owner_id = auth.uid()
  );
$$;

create policy "members_select" on public.competition_members
  for select using (
    user_id = auth.uid()
    or public.is_member_of(competition_id)
    or public.is_owner_of(competition_id)
  );

-- INSERT split into two paths so we can pin role for self-join and let
-- organizers/owners add anyone with any role.
create policy "members_self_insert" on public.competition_members
  for insert with check (
    user_id = auth.uid()
    and role   = 'competitor'
    and status in ('active', 'waitlisted')
  );

create policy "members_organizer_insert" on public.competition_members
  for insert with check (
    public.is_owner_of(competition_id)
    or exists (
      select 1 from public.competition_members cm2
      where cm2.competition_id = competition_id
        and cm2.user_id        = auth.uid()
        and cm2.role           = 'organizer'
        and cm2.status         = 'active'
    )
  );

-- Strengthen the role-escalation trigger to also block self-promotion on
-- INSERT (the previous trigger only fired on UPDATE).
create or replace function public.prevent_self_role_status_change()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    -- Self-join: force role=competitor, status in (active, waitlisted).
    -- Owners/organizers inserting OTHER users are unaffected.
    if new.user_id = auth.uid() then
      -- Only allow if the inserter does not yet hold an organizer role
      -- in this competition (first-time join). Owners of the competition
      -- are allowed to self-insert with any role.
      if not public.is_owner_of(new.competition_id) then
        new.role := 'competitor';
        if new.status not in ('active', 'waitlisted') then
          new.status := 'active';
        end if;
      end if;
    end if;
    return new;
  end if;

  -- UPDATE path (unchanged behaviour): block self role/status escalation
  -- unless already an organizer.
  if new.user_id = auth.uid() and old.role <> 'organizer' then
    new.role   := old.role;
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_role_status_change on public.competition_members;
create trigger trg_prevent_self_role_status_change
  before insert or update on public.competition_members
  for each row execute function public.prevent_self_role_status_change();


-- ── completions: scope writes to active members of the competition ──────────
drop policy if exists "completion_read"      on public.completions;
drop policy if exists "competitor_write_own" on public.completions;
drop policy if exists "organizer_write_any"  on public.completions;

create policy "completions_select" on public.completions
  for select using (
    public.is_owner_of(competition_id)
    or public.is_member_of(competition_id)
    or exists (
      select 1 from public.competitions c
      where c.id = competition_id and c.visibility = 'public'
    )
  );

-- Competitors may only write their own row, and only in competitions
-- where they are an active member.
create policy "completions_competitor_insert" on public.completions
  for insert with check (
    competitor_id = auth.uid()
    and public.is_member_of(competition_id)
  );

create policy "completions_competitor_update" on public.completions
  for update using (
    competitor_id = auth.uid()
    and public.is_member_of(competition_id)
  ) with check (
    competitor_id = auth.uid()
    and public.is_member_of(competition_id)
  );

create policy "completions_competitor_delete" on public.completions
  for delete using (
    competitor_id = auth.uid()
    and public.is_member_of(competition_id)
  );

-- Organizers and judges of the competition may write any row.
create policy "completions_staff_write" on public.completions
  for all using (
    public.is_owner_of(competition_id)
    or exists (
      select 1 from public.competition_members cm
      where cm.competition_id = competition_id
        and cm.user_id        = auth.uid()
        and cm.role           in ('organizer', 'judge')
        and cm.status         = 'active'
    )
  ) with check (
    public.is_owner_of(competition_id)
    or exists (
      select 1 from public.competition_members cm
      where cm.competition_id = competition_id
        and cm.user_id        = auth.uid()
        and cm.role           in ('organizer', 'judge')
        and cm.status         = 'active'
    )
  );


-- ── payments: enforce idempotency at the DB level ───────────────────────────
-- H1: Stripe retries webhooks; the unique index ensures a duplicate
-- delivery cannot insert a second payment row, which in turn allows the
-- webhook code to gate state mutations on "did this insert actually happen?".
create unique index if not exists payments_stripe_session_id_uniq
  on public.payments (stripe_session_id)
  where stripe_session_id is not null;
