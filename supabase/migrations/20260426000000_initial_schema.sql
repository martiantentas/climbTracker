-- ─────────────────────────────────────────────────────────────────────────────
-- Ascendr — Initial Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- One row per auth.users entry. Created automatically via trigger on sign-up.

create table if not exists public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  email         text        not null,
  display_name  text,
  avatar_url    text,
  emoji         text,
  lang          text        not null default 'en' check (lang in ('en', 'es', 'ca')),
  theme         text        not null default 'dark' check (theme in ('light', 'dark')),
  location      text,
  bio           text,
  trait_ids     text[]      not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create profile on new user sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─── COMPETITIONS ─────────────────────────────────────────────────────────────

create table if not exists public.competitions (
  id                  text        primary key default gen_random_uuid()::text,
  owner_id            uuid        not null references public.profiles(id) on delete cascade,
  name                text        not null,
  location            text,
  start_date          timestamptz not null default now(),
  end_date            timestamptz not null default (now() + interval '1 day'),
  status              text        not null default 'DRAFT' check (status in ('DRAFT', 'LIVE', 'FINISHED', 'ARCHIVED')),
  visibility          text        not null default 'public' check (visibility in ('public', 'private')),
  invite_code         text        unique,
  scoring_mode        text        not null default 'admin' check (scoring_mode in ('admin', 'self', 'judges')),
  description         text,
  rules               text,
  tier                text        check (tier in ('standard', 'premium')),
  subscription        text,
  participant_limit   integer     check (participant_limit > 0),
  additional_capacity integer     check (additional_capacity >= 0),
  branding            jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger competitions_updated_at
  before update on public.competitions
  for each row execute function public.set_updated_at();

-- ─── COMPETITION MEMBERS ──────────────────────────────────────────────────────

create table if not exists public.competition_members (
  id              uuid        primary key default gen_random_uuid(),
  competition_id  text        not null references public.competitions(id) on delete cascade,
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  role            text        not null default 'competitor' check (role in ('organizer', 'judge', 'competitor')),
  bib_number      integer,
  trait_ids       text[]      not null default '{}',
  joined_at       timestamptz not null default now(),
  unique (competition_id, user_id)
);

create index if not exists idx_members_comp   on public.competition_members(competition_id);
create index if not exists idx_members_user   on public.competition_members(user_id);

-- ─── BOULDERS ─────────────────────────────────────────────────────────────────

create table if not exists public.boulders (
  id              text        primary key default gen_random_uuid()::text,
  competition_id  text        not null references public.competitions(id) on delete cascade,
  name            text        not null,
  color           text,
  points          integer     not null default 100,
  bonus_points    integer     not null default 25,
  zone_points     integer     not null default 10,
  is_active       boolean     not null default true,
  sort_order      integer     not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists idx_boulders_comp on public.boulders(competition_id);

-- ─── COMPLETIONS ──────────────────────────────────────────────────────────────

create table if not exists public.completions (
  id              uuid        primary key default gen_random_uuid(),
  competition_id  text        not null references public.competitions(id) on delete cascade,
  boulder_id      text        not null references public.boulders(id) on delete cascade,
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  topped          boolean     not null default false,
  zone            boolean     not null default false,
  attempts        integer     not null default 1 check (attempts >= 1),
  recorded_by     uuid        references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (competition_id, boulder_id, user_id)
);

create index if not exists idx_completions_comp   on public.completions(competition_id);
create index if not exists idx_completions_user   on public.completions(user_id);
create index if not exists idx_completions_boulder on public.completions(boulder_id);

create trigger completions_updated_at
  before update on public.completions
  for each row execute function public.set_updated_at();

-- ─── PAYMENTS ─────────────────────────────────────────────────────────────────

create table if not exists public.payments (
  id                  uuid        primary key default gen_random_uuid(),
  competition_id      text        not null references public.competitions(id) on delete restrict,
  user_id             uuid        not null references public.profiles(id) on delete restrict,
  stripe_payment_id   text        unique,
  stripe_session_id   text        unique,
  amount_cents        integer     not null check (amount_cents > 0),
  currency            text        not null default 'eur',
  status              text        not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  tier                text        not null check (tier in ('standard', 'premium')),
  participant_limit   integer     not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_payments_comp on public.payments(competition_id);
create index if not exists idx_payments_user on public.payments(user_id);

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ─── ROW-LEVEL SECURITY ───────────────────────────────────────────────────────

alter table public.profiles           enable row level security;
alter table public.competitions        enable row level security;
alter table public.competition_members enable row level security;
alter table public.boulders            enable row level security;
alter table public.completions         enable row level security;
alter table public.payments            enable row level security;

-- ── Profiles ──
create policy "Users can read any profile"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ── Competitions ──
create policy "Anyone can read public or live competitions"
  on public.competitions for select
  using (
    visibility = 'public'
    or owner_id = auth.uid()
    or exists (
      select 1 from public.competition_members m
      where m.competition_id = competitions.id and m.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create competitions"
  on public.competitions for insert
  with check (auth.uid() is not null and owner_id = auth.uid());

create policy "Owner can update competition"
  on public.competitions for update
  using (owner_id = auth.uid());

create policy "Owner can delete competition"
  on public.competitions for delete
  using (owner_id = auth.uid());

-- ── Competition Members ──
create policy "Members and owners can read members"
  on public.competition_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.competitions c
      where c.id = competition_id and c.owner_id = auth.uid()
    )
  );

create policy "Users can join competitions (competitor role only)"
  on public.competition_members for insert
  with check (auth.uid() = user_id and role = 'competitor');

create policy "Owner can manage members"
  on public.competition_members for all
  using (
    exists (
      select 1 from public.competitions c
      where c.id = competition_id and c.owner_id = auth.uid()
    )
  );

create policy "Members can update own entry"
  on public.competition_members for update
  using (user_id = auth.uid());

-- ── Boulders ──
create policy "Members can read boulders"
  on public.boulders for select
  using (
    exists (
      select 1 from public.competition_members m
      where m.competition_id = boulders.competition_id and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.competitions c
      where c.id = boulders.competition_id and c.owner_id = auth.uid()
    )
  );

create policy "Owner and judges can manage boulders"
  on public.boulders for all
  using (
    exists (
      select 1 from public.competitions c
      where c.id = boulders.competition_id and c.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.competition_members m
      where m.competition_id = boulders.competition_id
        and m.user_id = auth.uid()
        and m.role in ('organizer', 'judge')
    )
  );

-- ── Completions ──
create policy "Members can read all completions in their competition"
  on public.completions for select
  using (
    exists (
      select 1 from public.competition_members m
      where m.competition_id = completions.competition_id and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.competitions c
      where c.id = completions.competition_id and c.owner_id = auth.uid()
    )
  );

create policy "Competitors can record own completions (self-scoring)"
  on public.completions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.competitions c
      where c.id = competition_id and c.scoring_mode = 'self' and c.status = 'LIVE'
    )
  );

create policy "Judges and owners can record any completion"
  on public.completions for all
  using (
    exists (
      select 1 from public.competitions c
      where c.id = competition_id and c.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.competition_members m
      where m.competition_id = completions.competition_id
        and m.user_id = auth.uid()
        and m.role in ('organizer', 'judge')
    )
  );

-- ── Payments ──
create policy "Users can read own payments"
  on public.payments for select
  using (user_id = auth.uid());

create policy "Owners can read payments for their competitions"
  on public.payments for select
  using (
    exists (
      select 1 from public.competitions c
      where c.id = competition_id and c.owner_id = auth.uid()
    )
  );

-- Payments are only written server-side via Edge Functions (service_role key).
-- No client INSERT/UPDATE policies needed.
