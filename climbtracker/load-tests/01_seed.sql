-- ============================================================
-- Ascendr load test: 01 seed (run in the Supabase SQL Editor)
--
-- Creates ONLY test data. It never writes to the real event.
--   • competition  comp-loadtest  (private, invite code LOADTEST, LIVE)
--     copied from the real event's settings so payload sizes are realistic
--   • 40 boulders  (every 4th one is judge-only, like the real format)
--   • accounts     *@ascendr-loadtest.invalid   password: LoadTest-2026!
--       lt-owner                 owner of the test competition
--       lt-judge-01 … lt-judge-10  judges (already members)
--       lt-001 … lt-400          competitors: NOT members, k6 joins them
--       lt-bg-001 … lt-bg-250    "background" competitors, already joined,
--                                with ~60% of boulders scored, so the
--                                database looks like the end of the event
--
-- Safe to re-run: it deletes and recreates comp-loadtest (and all its
-- boulders, members and scores). Accounts are reused.
-- Remove everything afterwards with 03_cleanup.sql.
-- ============================================================

create or replace function pg_temp.lt_user(p_email text, p_name text, p_hash text)
returns uuid language plpgsql as $$
declare v_id uuid;
begin
  select id into v_id from auth.users where email = p_email;
  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      p_email, p_hash, now(),
      '', '', '', '',
      now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', p_name), false
    );
    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_id::text, v_id,
      jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true),
      'email', now(), now(), now()
    );
  end if;
  insert into public.profiles (id, email, display_name)
  values (v_id, p_email, p_name)
  on conflict (id) do update set display_name = excluded.display_name;
  return v_id;
end;
$$;

do $$
declare
  c_src         constant text := 'comp-1777411314368';   -- real event: READ ONLY
  c_comp        constant text := 'comp-loadtest';
  c_domain      constant text := '@ascendr-loadtest.invalid';
  c_boulders    constant int  := 40;
  c_judges      constant int  := 10;
  c_competitors constant int  := 400;
  c_background  constant int  := 250;
  v_hash   text := extensions.crypt('LoadTest-2026!', extensions.gen_salt('bf', 6));
  v_owner  uuid;
  v_data   jsonb;
  v_levels text[];
  v_judge  uuid;
  i        int;
begin
  -- Accounts
  v_owner := pg_temp.lt_user('lt-owner' || c_domain, 'LT Owner', v_hash);
  for i in 1..c_judges loop
    perform pg_temp.lt_user('lt-judge-' || lpad(i::text, 2, '0') || c_domain, 'LT Judge ' || i, v_hash);
  end loop;
  for i in 1..c_competitors loop
    perform pg_temp.lt_user('lt-' || lpad(i::text, 3, '0') || c_domain, 'LT Climber ' || i, v_hash);
  end loop;
  for i in 1..c_background loop
    perform pg_temp.lt_user('lt-bg-' || lpad(i::text, 3, '0') || c_domain, 'LT Background ' || i, v_hash);
  end loop;

  -- Fresh test competition (cascade removes old boulders, members, scores)
  delete from public.competitions where id = c_comp;

  select data into v_data from public.competitions where id = c_src;
  v_data := coalesce(v_data, '{"scoringType":"traditional","traits":[],"difficultyLevels":[]}'::jsonb)
            - 'joinPassword' - 'bannedEmails'
            || jsonb_build_object(
                 'id',                 c_comp,
                 'ownerId',            v_owner,
                 'name',               'LOADTEST (prueba de carga, se borra)',
                 'status',             'LIVE',
                 'visibility',         'private',
                 'inviteCode',         'LOADTEST',
                 'isLocked',           false,
                 'canSelfScore',       true,
                 'participantLimit',   300,
                 'additionalCapacity', 500,
                 'bannedEmails',       '[]'::jsonb);

  insert into public.competitions (id, owner_id, status, visibility, invite_code, data)
  values (c_comp, v_owner, 'LIVE', 'private', 'LOADTEST', v_data);

  -- Boulders: difficulty levels copied from the real event (if any)
  select array_agg(l->>'id') into v_levels
    from jsonb_array_elements(coalesce(v_data->'difficultyLevels', '[]'::jsonb)) as l
   where l ? 'id';

  insert into public.boulders (id, competition_id, position, data)
  select 'lt-b-' || lpad(n::text, 2, '0'), c_comp, n,
         jsonb_strip_nulls(jsonb_build_object(
           'id',           'lt-b-' || lpad(n::text, 2, '0'),
           'number',       n,
           'name',         'LT ' || n,
           'color',        (array['red','blue','green','yellow','orange','purple','pink','white','black','gray'])[1 + (n - 1) % 10],
           'status',       'active',
           'zoneCount',    1,
           'tags',         '[]'::jsonb,
           'isPuntuable',  (n % 4 = 0),
           'difficultyId', case when coalesce(array_length(v_levels, 1), 0) > 0
                                then v_levels[1 + (n - 1) % array_length(v_levels, 1)] end))
    from generate_series(1, c_boulders) as n;

  -- Owner as organizer (same as the real event), judges as judges
  insert into public.competition_members (competition_id, user_id, role, status, bib_number)
  values (c_comp, v_owner, 'organizer', 'active', 0);

  insert into public.competition_members (competition_id, user_id, role, status, bib_number)
  select c_comp, u.id, 'judge', 'active', 0
    from auth.users u
   where u.email like 'lt-judge-%' || c_domain;

  -- Background competitors: already joined, bibs 101…
  insert into public.competition_members (competition_id, user_id, role, status, bib_number, joined_at)
  select c_comp, u.id, 'competitor', 'active',
         100 + row_number() over (order by u.email),
         now() - interval '3 hours' + (row_number() over (order by u.email)) * interval '1 second'
    from auth.users u
   where u.email like 'lt-bg-%' || c_domain;

  -- Their scores: ~60% of boulders each, judge boulders validated by a judge
  select id into v_judge from auth.users where email = 'lt-judge-01' || c_domain;

  insert into public.completions (competition_id, competitor_id, boulder_id, data)
  select c_comp, m.user_id, b.id,
         jsonb_strip_nulls(jsonb_build_object(
           'competitorId',   m.user_id,
           'boulderId',      b.id,
           'attempts',       r.att,
           'timestamp',      (extract(epoch from now() - interval '2 hours') * 1000)::bigint + r.ms,
           'hasZone',        true,
           'zoneAttempts',   1 + floor(random() * r.att)::int,
           'zonesReached',   1,
           'topValidated',   r.top,
           'topValidatedBy', case when (b.data->>'isPuntuable')::boolean and r.top then v_judge::text end,
           'topValidatedAt', case when (b.data->>'isPuntuable')::boolean and r.top
                                  then (extract(epoch from now() - interval '1 hour') * 1000)::bigint end))
    from public.competition_members m
    cross join public.boulders b
    cross join lateral (
      select 1 + floor(random() * 5)::int        as att,
             random() < 0.7                      as top,
             floor(random() * 3600000)::bigint   as ms
     where m.user_id is not null and b.id is not null   -- outer refs: new random values per row
    ) r
   where m.competition_id = c_comp and m.role = 'competitor'
     and b.competition_id = c_comp
     and random() < 0.6;
end $$;

-- ── Check (expected: 1 · 40 · 10 · 250 · ~6000 · 400) ──────────────────
select
  (select count(*) from public.competitions where id = 'comp-loadtest')                          as competition,
  (select count(*) from public.boulders     where competition_id = 'comp-loadtest')              as boulders,
  (select count(*) from public.competition_members where competition_id = 'comp-loadtest' and role = 'judge') as judges,
  (select count(*) from public.competition_members where competition_id = 'comp-loadtest' and role = 'competitor') as background_competitors,
  (select count(*) from public.completions  where competition_id = 'comp-loadtest')              as background_scores,
  (select count(*) from auth.users where email like 'lt-___@ascendr-loadtest.invalid')           as k6_accounts;
