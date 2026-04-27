-- ============================================================
-- Ascendr — full schema migration
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- Safe to re-run: drops and recreates all competition tables.
-- The `profiles` table is NOT dropped (auth trigger creates it).
-- ============================================================

-- ── Drop existing competition tables ─────────────────────────────────────────
drop table if exists public.payments          cascade;
drop table if exists public.completions       cascade;
drop table if exists public.boulders          cascade;
drop table if exists public.competition_members cascade;
drop table if exists public.competitions      cascade;

-- ── competitions ─────────────────────────────────────────────────────────────
create table public.competitions (
  id          text        primary key,
  owner_id    uuid        not null references auth.users(id) on delete cascade,
  status      text        not null default 'DRAFT',
  visibility  text        not null default 'private',
  invite_code text        unique,
  data        jsonb       not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.competitions(owner_id);
create index on public.competitions(status);
create index on public.competitions(visibility);

-- ── boulders ─────────────────────────────────────────────────────────────────
create table public.boulders (
  id             text        primary key,
  competition_id text        not null references public.competitions(id) on delete cascade,
  position       integer     not null default 0,
  data           jsonb       not null,
  created_at     timestamptz not null default now()
);
create index on public.boulders(competition_id);

-- ── competition_members ───────────────────────────────────────────────────────
create table public.competition_members (
  competition_id text        not null references public.competitions(id) on delete cascade,
  user_id        uuid        not null references auth.users(id) on delete cascade,
  role           text        not null default 'competitor',  -- competitor | judge | organizer
  status         text        not null default 'active',      -- active | waitlisted
  bib_number     integer,
  trait_ids      text[]      not null default '{}',
  gender         text,
  joined_at      timestamptz not null default now(),
  primary key (competition_id, user_id)
);
create index on public.competition_members(user_id);

-- ── completions ───────────────────────────────────────────────────────────────
create table public.completions (
  competition_id text        not null references public.competitions(id) on delete cascade,
  competitor_id  uuid        not null references auth.users(id) on delete cascade,
  boulder_id     text        not null references public.boulders(id) on delete cascade,
  data           jsonb       not null,
  updated_at     timestamptz not null default now(),
  primary key (competition_id, competitor_id, boulder_id)
);
create index on public.completions(competition_id);

-- ── payments ─────────────────────────────────────────────────────────────────
create table public.payments (
  id                 uuid        primary key default gen_random_uuid(),
  competition_id     text        not null references public.competitions(id) on delete cascade,
  user_id            uuid        not null references auth.users(id),
  stripe_payment_id  text,
  stripe_session_id  text,
  amount_cents       integer     not null,
  currency           text        not null default 'eur',
  status             text        not null default 'pending',
  tier               text        not null,
  participant_limit  integer     not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── updated_at trigger ────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger competitions_updated_at
  before update on public.competitions
  for each row execute function public.set_updated_at();

create trigger completions_updated_at
  before update on public.completions
  for each row execute function public.set_updated_at();

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.competitions        enable row level security;
alter table public.boulders            enable row level security;
alter table public.competition_members enable row level security;
alter table public.completions         enable row level security;
alter table public.payments            enable row level security;

-- competitions: owner has full write access; all authenticated users can read.
-- Intentionally no subquery to competition_members here — any cross-table
-- subquery between competitions ↔ competition_members creates infinite RLS recursion.
create policy "owner_all" on public.competitions
  for all using (owner_id = auth.uid());

create policy "authenticated_read" on public.competitions
  for select using (auth.role() = 'authenticated');

-- boulders: readable if you can read the competition; writable by owner/organizer
create policy "boulder_read" on public.boulders
  for select using (
    exists (
      select 1 from public.competitions c
      where c.id = competition_id
        and (c.owner_id = auth.uid()
          or c.visibility = 'public'
          or exists (
            select 1 from public.competition_members cm
            where cm.competition_id = c.id
              and cm.user_id = auth.uid()
              and cm.status = 'active'
          ))
    )
  );

create policy "boulder_write" on public.boulders
  for all using (
    exists (select 1 from public.competitions c where c.id = competition_id and c.owner_id = auth.uid())
    or exists (
      select 1 from public.competition_members cm
      where cm.competition_id = competition_id
        and cm.user_id = auth.uid()
        and cm.role = 'organizer'
        and cm.status = 'active'
    )
  );

-- competition_members: split by operation to avoid FOR ALL triggering SELECT subqueries
-- that cause cross-table RLS recursion (competition_members ↔ competitions loop).

-- READ: simple authenticated check — no cross-table subquery, no recursion possible.
create policy "member_read" on public.competition_members
  for select using (auth.role() = 'authenticated');

-- INSERT: self-join or organizer adds someone.
-- Inner SELECT on cm2 only triggers member_read (FOR SELECT) → no recursion.
create policy "organizer_insert" on public.competition_members
  for insert with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.competition_members cm2
      where cm2.competition_id = competition_id
        and cm2.user_id = auth.uid()
        and cm2.role = 'organizer'
        and cm2.status = 'active'
    )
  );

-- UPDATE: self or organizer modifies a row.
create policy "organizer_update" on public.competition_members
  for update using (
    user_id = auth.uid()
    or exists (
      select 1 from public.competition_members cm2
      where cm2.competition_id = competition_id
        and cm2.user_id = auth.uid()
        and cm2.role = 'organizer'
        and cm2.status = 'active'
    )
  );

-- DELETE: self-leave or organizer removes a member.
create policy "organizer_delete" on public.competition_members
  for delete using (
    user_id = auth.uid()
    or exists (
      select 1 from public.competition_members cm2
      where cm2.competition_id = competition_id
        and cm2.user_id = auth.uid()
        and cm2.role = 'organizer'
        and cm2.status = 'active'
    )
  );

-- completions: readable by competition members; writable by the competitor or judges/organizers
create policy "completion_read" on public.completions
  for select using (
    exists (
      select 1 from public.competitions c
      where c.id = competition_id
        and (c.owner_id = auth.uid()
          or c.visibility = 'public'
          or exists (
            select 1 from public.competition_members cm
            where cm.competition_id = c.id
              and cm.user_id = auth.uid()
              and cm.status = 'active'
          ))
    )
  );

create policy "competitor_write_own" on public.completions
  for all using (competitor_id = auth.uid());

create policy "organizer_write_any" on public.completions
  for all using (
    exists (select 1 from public.competitions c where c.id = competition_id and c.owner_id = auth.uid())
    or exists (
      select 1 from public.competition_members cm
      where cm.competition_id = competition_id
        and cm.user_id = auth.uid()
        and cm.role in ('organizer', 'judge')
        and cm.status = 'active'
    )
  );

-- payments: only the paying user can see/manage their payments
create policy "payment_owner" on public.payments
  for all using (user_id = auth.uid());
