-- ============================================================
-- Ascendr — seed data per proves de càrrega
-- competition_id: comp-1777411314368
--
-- Executa al Supabase SQL Editor amb SERVICE ROLE
-- Esborra totes les dades de prova amb cleanup_loadtest.sql
-- ============================================================

create extension if not exists pgcrypto;

-- ── 1. Boulders de prova (10) ──────────────────────────────
insert into public.boulders (id, competition_id, position, data)
select
  'boulder-test-' || i,
  'comp-1777411314368',
  i,
  jsonb_build_object(
    'id',          'boulder-test-' || i,
    'number',      i,
    'name',        'Test Boulder ' || i,
    'color',       (array['red','blue','green','yellow','orange',
                          'purple','pink','white','black','gray'])[i],
    'status',      'active',
    'zoneCount',   1,
    'tags',        '[]'::jsonb,
    'isPuntuable', true
  )
from generate_series(1, 10) as i
on conflict (id) do nothing;

-- ── 2. Usuaris de test (50 competidors) ───────────────────
-- Contrasenya: LoadTest123!
-- Emails: test-1@ascendr-loadtest.invalid … test-50@ascendr-loadtest.invalid
do $$
declare
  new_id uuid;
  i      int;
begin
  for i in 1..50 loop
    -- Salta si l'usuari ja existeix (evita ON CONFLICT sobre auth.users)
    if exists (
      select 1 from auth.users
      where email = 'test-' || i || '@ascendr-loadtest.invalid'
    ) then
      continue;
    end if;

    new_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role,
      email, encrypted_password,
      email_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin
    ) values (
      '00000000-0000-0000-0000-000000000000',
      new_id,
      'authenticated',
      'authenticated',
      'test-' || i || '@ascendr-loadtest.invalid',
      crypt('LoadTest123!', gen_salt('bf')),
      now(),
      '', '', '',
      now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Test User ' || i),
      false
    );

    -- Sense aquesta entrada el login email/password falla
    insert into auth.identities (
      id, provider_id, user_id,
      identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      new_id,
      new_id::text,
      new_id,
      jsonb_build_object(
        'sub',   new_id::text,
        'email', 'test-' || i || '@ascendr-loadtest.invalid'
      ),
      'email',
      now(), now(), now()
    );

    insert into public.competition_members (
      competition_id, user_id, role, status,
      bib_number, trait_ids
    ) values (
      'comp-1777411314368', new_id,
      'competitor', 'active',
      i, '{}'
    )
    on conflict (competition_id, user_id) do nothing;

  end loop;
end $$;

-- ── Verifica ──────────────────────────────────────────────
select count(*) as boulders_created
from public.boulders
where competition_id = 'comp-1777411314368'
  and id like 'boulder-test-%';

select count(*) as members_created
from public.competition_members cm
join auth.users u on u.id = cm.user_id
where cm.competition_id = 'comp-1777411314368'
  and u.email like '%@ascendr-loadtest.invalid';
