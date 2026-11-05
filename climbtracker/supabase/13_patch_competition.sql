-- ============================================================
-- Ascendr — 13 patch_competition: save only what changed
-- Safe to re-run. Compatible with every frontend version (the app falls
-- back to a full update if this function does not exist).
--
-- Problem: saving settings sent the WHOLE competition object. A tab opened
-- earlier (stale copy) silently overwrote newer changes made elsewhere,
-- e.g. it unlocked results locked from a phone, or undid a capacity change.
-- Now the app sends only the fields the user changed, and the database
-- merges them onto the CURRENT row: data = (data || p_set) - p_unset.
-- Only the owner or an active organizer of the competition may call it.
-- id and ownerId can never be changed through it.
-- ============================================================

create or replace function public.patch_competition(
  p_competition_id text,
  p_set            jsonb,
  p_unset          text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_set   jsonb  := coalesce(p_set, '{}'::jsonb) - 'id' - 'ownerId';
  v_unset text[] := array(select k from unnest(coalesce(p_unset, '{}')) as k where k not in ('id', 'ownerId'));
  v_data  jsonb;
begin
  if auth.uid() is null
     or not (public.is_owner_of(p_competition_id)
             or public.has_comp_role(p_competition_id, array['organizer'])) then
    raise exception 'not_permitted' using errcode = '42501';
  end if;

  update public.competitions
     set data        = (data || v_set) - v_unset,
         status      = coalesce(v_set->>'status',     status),
         visibility  = coalesce(v_set->>'visibility', visibility),
         invite_code = case when v_set ? 'inviteCode'
                            then nullif(v_set->>'inviteCode', '')
                            else invite_code end
   where id = p_competition_id
   returning data into v_data;

  if v_data is null then
    raise exception 'competition_not_found' using errcode = 'P0002';
  end if;
  return v_data;
end;
$$;
revoke all on function public.patch_competition(text, jsonb, text[]) from public, anon;
grant execute on function public.patch_competition(text, jsonb, text[]) to authenticated;
