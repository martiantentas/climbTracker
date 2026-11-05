-- ============================================================
-- Ascendr — 15 fast read policies
-- Safe to re-run. Compatible with every frontend version.
-- WHO CAN SEE WHAT DOES NOT CHANGE: every policy below gives exactly the
-- same rows as before (checked row by row in the test suite).
--
-- Problem (found by the k6 load test on Large compute): the read rules
-- for scores, boulders, members and profiles ran 2-3 sub-queries FOR EVERY
-- ROW. Loading the scores of the event (~7 000 rows, read in pages of
-- 1 000) meant ~28 000 of those checks per phone, every time a phone woke
-- up. With 300 phones the database spent its time checking permissions:
-- score saves took 6-10 s and realtime fell behind.
--
-- Now each rule computes "the competitions you can see" ONCE per query
-- (`x in (select f())` runs f once and builds a small lookup table) and
-- each row only checks membership in that short list.
-- ============================================================

begin;

-- Competitions whose scores and boulders you can read:
-- you own it, you are an active member, or it is public.
create or replace function public.readable_competition_ids()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select id from public.competitions where owner_id = auth.uid()
  union
  select competition_id from public.competition_members
   where user_id = auth.uid() and status = 'active'
  union
  select id from public.competitions where visibility = 'public';
$$;

-- Competitions whose member list you can read:
-- you own it or you are an active member (NOT just because it is public).
create or replace function public.member_competition_ids()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select id from public.competitions where owner_id = auth.uid()
  union
  select competition_id from public.competition_members
   where user_id = auth.uid() and status = 'active';
$$;

-- People whose profile you can read: anyone in a competition where you are
-- a member (any status) or that you own. Same rule as shares_competition_with().
create or replace function public.visible_profile_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select distinct them.user_id
    from public.competition_members them
   where them.competition_id in (
           select me.competition_id from public.competition_members me where me.user_id = auth.uid()
           union all
           select c.id from public.competitions c where c.owner_id = auth.uid()
         );
$$;

revoke all on function public.readable_competition_ids() from public, anon;
revoke all on function public.member_competition_ids()   from public, anon;
revoke all on function public.visible_profile_ids()      from public, anon;
grant execute on function public.readable_competition_ids() to authenticated;
grant execute on function public.member_competition_ids()   to authenticated;
grant execute on function public.visible_profile_ids()      to authenticated;

-- Scores
drop policy if exists "completions_select" on public.completions;
create policy "completions_select" on public.completions
  for select to authenticated
  using (competition_id in (select public.readable_competition_ids()));

-- Boulders
drop policy if exists "boulder_read" on public.boulders;
create policy "boulder_read" on public.boulders
  for select to authenticated
  using (competition_id in (select public.readable_competition_ids()));

-- Members
drop policy if exists "members_select" on public.competition_members;
create policy "members_select" on public.competition_members
  for select to authenticated
  using (user_id = (select auth.uid())
         or competition_id in (select public.member_competition_ids()));

-- Profiles
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = (select auth.uid())
         or id in (select public.visible_profile_ids()));

commit;

-- Check (expected: 4 rows, each policy now uses one of the new functions)
select tablename, policyname
  from pg_policies
 where schemaname = 'public'
   and policyname in ('completions_select', 'boulder_read', 'members_select', 'profiles_select')
   and (qual like '%readable_competition_ids%' or qual like '%member_competition_ids%' or qual like '%visible_profile_ids%');
