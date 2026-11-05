-- ============================================================
-- Ascendr — 14 public leaderboard cache
-- Safe to re-run. Compatible with every frontend version (same function
-- name, same arguments, same result).
--
-- Problem (found by the k6 load test): every viewer of the public results
-- page rebuilt the WHOLE competition snapshot (~1.5 MB, every score of every
-- climber). One build takes ~0.2 s; 20 at once took 4-11 s and half failed.
-- 50 spectators were enough to starve the database, so joins, score saves
-- and realtime failed for everyone.
--
-- Now: the snapshot is built at most once every 20 s per competition and
-- stored in a cache table. Every other viewer gets the stored copy, which
-- costs almost nothing. While one request rebuilds it, the others get the
-- previous copy instead of waiting. Public results lag at most ~20 s.
-- ============================================================

begin;

-- UNLOGGED: no write-ahead log (it is only a cache; lost on a crash, rebuilt
-- on the next request). No policies + RLS on: never readable through the API.
create unlogged table if not exists public.public_leaderboard_cache (
  competition_id text        primary key references public.competitions(id) on delete cascade,
  payload        jsonb       not null,
  built_at       timestamptz not null
);
alter table public.public_leaderboard_cache enable row level security;
revoke all on public.public_leaderboard_cache from public, anon, authenticated;

-- The builder: exactly the previous get_public_leaderboard body (07).
-- Not callable through the API.
create or replace function public.build_public_leaderboard(p_competition_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_comp jsonb;
begin
  select data - 'joinPassword' - 'inviteCode' - 'bannedEmails'
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
               'user_id',      m.user_id,
               'role',         m.role,
               'status',       m.status,
               'bib_number',   m.bib_number,
               'trait_ids',    m.trait_ids,
               'gender',       m.gender,
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
revoke all on function public.build_public_leaderboard(text) from public, anon, authenticated;

-- The API function: same signature and result as before, served from cache.
-- (Drop first: the old one is STABLE and this one writes the cache.)
drop function if exists public.get_public_leaderboard(text);
create function public.get_public_leaderboard(p_competition_id text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  c_ttl    constant interval := interval '20 seconds';
  v_lock   bigint := hashtext('public_leaderboard:' || coalesce(p_competition_id, ''));
  v_cached jsonb;
  v_built  timestamptz;
  v_fresh  jsonb;
begin
  select payload, built_at into v_cached, v_built
    from public_leaderboard_cache where competition_id = p_competition_id;
  if v_cached is not null and v_built > clock_timestamp() - c_ttl then
    return v_cached;                                   -- fresh copy
  end if;

  if not pg_try_advisory_xact_lock(v_lock) then
    -- Someone else is rebuilding right now.
    if v_cached is not null then
      return v_cached;                                 -- previous copy, no waiting
    end if;
    perform pg_advisory_xact_lock(v_lock);             -- first build ever: wait for it
  end if;

  -- We hold the lock: another request may have rebuilt it meanwhile.
  select payload, built_at into v_cached, v_built
    from public_leaderboard_cache where competition_id = p_competition_id;
  if v_cached is not null and v_built > clock_timestamp() - c_ttl then
    return v_cached;
  end if;

  v_fresh := public.build_public_leaderboard(p_competition_id);
  if v_fresh is null then
    return null;                                       -- unknown competition: nothing cached
  end if;

  begin
    insert into public_leaderboard_cache (competition_id, payload, built_at)
    values (p_competition_id, v_fresh, clock_timestamp())
    on conflict (competition_id) do update
      set payload = excluded.payload, built_at = excluded.built_at;
  exception when others then
    null;   -- e.g. called read-only (GET): still answer, just without caching
  end;
  return v_fresh;
end;
$$;
revoke all on function public.get_public_leaderboard(text) from public;
grant execute on function public.get_public_leaderboard(text) to anon, authenticated;

commit;

-- Check (expected: event_found = true, then is_cached = 1)
select (public.get_public_leaderboard('comp-1777411314368') is not null) as event_found;
select count(*) as is_cached from public.public_leaderboard_cache where competition_id = 'comp-1777411314368';
