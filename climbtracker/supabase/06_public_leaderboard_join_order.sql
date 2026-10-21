-- ============================================================
-- Public leaderboard RPC, v2: competitors ordered by join date (used as the
-- final tiebreaker in rankings). Re-run safe (create or replace).
--
-- Anonymous visitors cannot read competitions/boulders/completions/members
-- because of RLS. This SECURITY DEFINER function returns only what the public
-- results page needs, and is the single anon entry point (no table grants).
-- Stripped from the payload: joinPassword, inviteCode, ownerId, member emails.
-- Run in Supabase SQL Editor.
-- ============================================================

create or replace function public.get_public_leaderboard(p_competition_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_comp jsonb;
begin
  select data - 'joinPassword' - 'inviteCode' - 'ownerId'
    into v_comp
    from competitions
   where id = p_competition_id;

  if v_comp is null then
    return null;
  end if;

  return jsonb_build_object(
    'competition', v_comp,
    'boulders', coalesce((
      select jsonb_agg(b.data order by b.position)
        from boulders b
       where b.competition_id = p_competition_id
    ), '[]'::jsonb),
    'completions', coalesce((
      select jsonb_agg(c.data)
        from completions c
       where c.competition_id = p_competition_id
    ), '[]'::jsonb),
    'competitors', coalesce((
      select jsonb_agg(jsonb_build_object(
               'user_id',    m.user_id,
               'role',       m.role,
               'status',     m.status,
               'bib_number', m.bib_number,
               'trait_ids',  m.trait_ids,
               'gender',     m.gender,
               'display_name', p.display_name,
               'avatar_url',   p.avatar_url,
               'emoji',        p.emoji) order by m.joined_at)
        from competition_members m
        left join profiles p on p.id = m.user_id
       where m.competition_id = p_competition_id
         and m.status = 'active'
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_public_leaderboard(text) from public;
grant execute on function public.get_public_leaderboard(text) to anon, authenticated;
