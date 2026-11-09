-- ============================================================
-- Ascendr — 16 in-app notifications (announcements)
-- Safe to re-run. Compatible with every frontend version: older frontends
-- simply never read this table.
--
-- Organizers (owner or active organizer) post announcements to their
-- competition. Each announcement can target a group of members; every
-- filter left empty means "everyone":
--   target_roles    competitor / judge / organizer
--   target_traits   categories (competition.traits ids)
--   target_genders  stored gender values
--   target_bibs     bib numbers
-- Filters combine with AND; the values inside one filter combine with OR.
-- A member only ever reads (and only receives in real time) the
-- announcements addressed to them; organizers read all of them.
-- Automatic notices (judge validated your top, results locked...) are
-- produced in the app from data it already receives, not stored here.
-- ============================================================

begin;

create table if not exists public.notifications (
  id              uuid        primary key default gen_random_uuid(),
  competition_id  text        not null references public.competitions(id) on delete cascade,
  title           text        not null check (char_length(btrim(title)) between 1 and 120),
  body            text        not null default '' check (char_length(body) <= 1000),
  target_roles    text[]      not null default '{}'
                              check (target_roles <@ array['competitor', 'judge', 'organizer']),
  target_traits   text[]      not null default '{}' check (cardinality(target_traits)  <= 100),
  target_genders  text[]      not null default '{}' check (cardinality(target_genders) <= 20),
  target_bibs     integer[]   not null default '{}' check (cardinality(target_bibs)    <= 2000),
  created_by      uuid        default auth.uid() references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists notifications_comp_created_idx
  on public.notifications (competition_id, created_at desc);

-- Can the current user read this announcement?
create or replace function public.notification_visible(
  p_competition_id text,
  p_roles          text[],
  p_traits         text[],
  p_genders        text[],
  p_bibs           integer[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_owner_of(p_competition_id)
      or public.has_comp_role(p_competition_id, array['organizer'])
      or exists (
           select 1
             from public.competition_members m
            where m.competition_id = p_competition_id
              and m.user_id        = auth.uid()
              and m.status         = 'active'
              and (cardinality(p_roles)   = 0 or m.role       = any(p_roles))
              and (cardinality(p_traits)  = 0 or m.trait_ids && p_traits)
              and (cardinality(p_genders) = 0 or m.gender     = any(p_genders))
              and (cardinality(p_bibs)    = 0 or m.bib_number = any(p_bibs))
         );
$$;
revoke all on function public.notification_visible(text, text[], text[], text[], integer[]) from public, anon;
grant execute on function public.notification_visible(text, text[], text[], text[], integer[]) to authenticated;

alter table public.notifications enable row level security;
revoke all on public.notifications from public, anon, authenticated;
grant select, insert, delete on public.notifications to authenticated;

drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications
  for select to authenticated
  using (public.notification_visible(competition_id, target_roles, target_traits, target_genders, target_bibs));

drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (public.is_owner_of(competition_id)
         or public.has_comp_role(competition_id, array['organizer']))
  );

drop policy if exists "notifications_delete" on public.notifications;
create policy "notifications_delete" on public.notifications
  for delete to authenticated
  using (public.is_owner_of(competition_id)
         or public.has_comp_role(competition_id, array['organizer']));

-- Safety net against accidental floods (a stuck button, a script):
-- at most 10 announcements per competition per minute.
create or replace function public.notifications_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.notifications
       where competition_id = new.competition_id
         and created_at > now() - interval '1 minute') >= 10 then
    raise exception 'too many announcements, wait a minute' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notifications_rate_limit on public.notifications;
create trigger trg_notifications_rate_limit
  before insert on public.notifications
  for each row execute function public.notifications_rate_limit();

-- Real-time delivery (the app listens to new rows of its competition).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                      where pubname = 'supabase_realtime'
                        and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

commit;

-- Check (expected: 3 policies, then in_realtime = true)
select policyname from pg_policies where schemaname = 'public' and tablename = 'notifications' order by 1;
select exists (select 1 from pg_publication_tables
                where pubname = 'supabase_realtime' and tablename = 'notifications') as in_realtime;
