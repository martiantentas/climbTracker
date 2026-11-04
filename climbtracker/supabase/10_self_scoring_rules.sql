-- ============================================================
-- Ascendr — 10 self-scoring rules enforced in the database
-- Apply AFTER 07. Safe to re-run. Compatible with the current frontend.
--
-- Until now these rules only existed in the screen, so a competitor could
-- bypass them by calling the API directly. A competitor may now write
-- (insert / update / delete) THEIR OWN score only if ALL of these hold:
--   • they are an active member of the competition
--   • the competition is not FINISHED or ARCHIVED
--   • results are not locked            (data.isLocked      <> true)
--   • self-scoring is enabled           (data.canSelfScore  <> false)
--   • the boulder belongs to this competition
--   • the boulder is not judge-required (boulder.isPuntuable <> true)
-- Owner, organizers and judges are NOT affected (policies from 07), so
-- staff can still correct any score.
-- ============================================================

begin;

create or replace function public.can_self_score(p_competition_id text, p_boulder_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.competitions c
      join public.boulders b
        on b.id = p_boulder_id
       and b.competition_id = c.id
     where c.id = p_competition_id
       and c.status not in ('FINISHED', 'ARCHIVED')
       and coalesce(c.data->>'isLocked',     'false') <> 'true'
       and coalesce(c.data->>'canSelfScore', 'true')  <> 'false'
       and coalesce(b.data->>'isPuntuable',  'false') <> 'true'
  );
$$;
grant execute on function public.can_self_score(text, text) to authenticated;

drop policy if exists "completions_competitor_insert" on public.completions;
drop policy if exists "completions_competitor_update" on public.completions;
drop policy if exists "completions_competitor_delete" on public.completions;

create policy "completions_competitor_insert" on public.completions
  for insert to authenticated
  with check (
    competitor_id = auth.uid()
    and public.is_member_of(competition_id)
    and public.can_self_score(competition_id, boulder_id)
  );

create policy "completions_competitor_update" on public.completions
  for update to authenticated
  using (
    competitor_id = auth.uid()
    and public.is_member_of(competition_id)
    and public.can_self_score(competition_id, boulder_id)
  )
  with check (
    competitor_id = auth.uid()
    and public.is_member_of(competition_id)
    and public.can_self_score(competition_id, boulder_id)
  );

create policy "completions_competitor_delete" on public.completions
  for delete to authenticated
  using (
    competitor_id = auth.uid()
    and public.is_member_of(competition_id)
    and public.can_self_score(competition_id, boulder_id)
  );

commit;
