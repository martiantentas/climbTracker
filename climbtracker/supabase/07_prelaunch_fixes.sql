-- ============================================================
-- Ascendr — 07 pre-launch fixes
-- Apply in Supabase SQL Editor AFTER 01..06. Safe to re-run.
-- Runs as one transaction: either everything applies or nothing does.
--
-- Backward compatible with the client currently deployed, so it can be
-- applied before the new frontend goes live.
--
-- Fixes:
--   A. RLS policies that compared a column with itself
--      (cm.competition_id = cm.competition_id), which let an organizer/judge
--      of ANY competition write boulders, completions and members of EVERY
--      competition.
--   B. verify_join_password declared p_competition_id as uuid while
--      competitions.id is text ('comp-<timestamp>'): every call failed.
--   C. Joining is now done server-side by join_competition(): invite lookup
--      for private competitions, password, bans, capacity and bib numbers
--      are enforced in one place. (Direct self-insert is blocked later by
--      08_lock_self_join.sql, once the new frontend is deployed.)
--   D. Co-organizers (role = organizer) can now update competition settings.
--      Only the owner can change owner_id.
--   E. Competitors cannot change their own bib number.
--   F. profiles are no longer readable by anonymous visitors or by unrelated
--      users: only yourself and people who share a competition with you.
--   G. Clients can no longer insert or edit payment rows (read-only).
--   H. Anonymous visitors can no longer read raw competitions / boulders /
--      completions (they use get_public_leaderboard instead).
--   I. profiles and payments are removed from the realtime publication.
-- ============================================================

begin;

-- ── Helper: does the caller hold one of these roles in this competition? ────
create or replace function public.has_comp_role(comp_id text, roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.competition_members
    where competition_id = comp_id
      and user_id        = auth.uid()
      and status         = 'active'
      and role           = any(roles)
  );
$$;
grant execute on function public.has_comp_role(text, text[]) to anon, authenticated;


-- ── A1. boulders: owner or organizer of THIS competition may write ─────────
drop policy if exists "boulder_write"          on public.boulders;
drop policy if exists "boulders_staff_insert"  on public.boulders;
drop policy if exists "boulders_staff_update"  on public.boulders;
drop policy if exists "boulders_staff_delete"  on public.boulders;

create policy "boulders_staff_insert" on public.boulders
  for insert to authenticated
  with check (public.is_owner_of(competition_id) or public.has_comp_role(competition_id, array['organizer']));

create policy "boulders_staff_update" on public.boulders
  for update to authenticated
  using      (public.is_owner_of(competition_id) or public.has_comp_role(competition_id, array['organizer']))
  with check (public.is_owner_of(competition_id) or public.has_comp_role(competition_id, array['organizer']));

create policy "boulders_staff_delete" on public.boulders
  for delete to authenticated
  using (public.is_owner_of(competition_id) or public.has_comp_role(competition_id, array['organizer']));


-- ── A2. completions: owner, organizer or judge of THIS competition ─────────
drop policy if exists "completions_staff_write"  on public.completions;
drop policy if exists "completions_staff_insert" on public.completions;
drop policy if exists "completions_staff_update" on public.completions;
drop policy if exists "completions_staff_delete" on public.completions;

create policy "completions_staff_insert" on public.completions
  for insert to authenticated
  with check (public.is_owner_of(competition_id) or public.has_comp_role(competition_id, array['organizer', 'judge']));

create policy "completions_staff_update" on public.completions
  for update to authenticated
  using      (public.is_owner_of(competition_id) or public.has_comp_role(competition_id, array['organizer', 'judge']))
  with check (public.is_owner_of(competition_id) or public.has_comp_role(competition_id, array['organizer', 'judge']));

create policy "completions_staff_delete" on public.completions
  for delete to authenticated
  using (public.is_owner_of(competition_id) or public.has_comp_role(competition_id, array['organizer', 'judge']));


-- ── A3. competition_members ─────────────────────────────────────────────────
-- Owner/organizer of THIS competition may add, edit and remove members.
-- NOTE: "members_self_insert" is intentionally kept here so the currently
-- deployed client can still join. It is removed by 08_lock_self_join.sql,
-- which must run only AFTER the new frontend (using join_competition) is live.
drop policy if exists "members_organizer_insert" on public.competition_members;
drop policy if exists "organizer_update"         on public.competition_members;
drop policy if exists "organizer_delete"         on public.competition_members;
drop policy if exists "members_staff_insert"     on public.competition_members;
drop policy if exists "members_update"           on public.competition_members;
drop policy if exists "members_delete"           on public.competition_members;

create policy "members_staff_insert" on public.competition_members
  for insert to authenticated
  with check (public.is_owner_of(competition_id) or public.has_comp_role(competition_id, array['organizer']));

create policy "members_update" on public.competition_members
  for update to authenticated
  using (
    user_id = auth.uid()
    or public.is_owner_of(competition_id)
    or public.has_comp_role(competition_id, array['organizer'])
  )
  with check (
    role   in ('competitor', 'judge', 'organizer')
    and status in ('active', 'waitlisted')
  );

create policy "members_delete" on public.competition_members
  for delete to authenticated
  using (
    user_id = auth.uid()
    or public.is_owner_of(competition_id)
    or public.has_comp_role(competition_id, array['organizer'])
  );

-- ── E. Self-edit guard: a non-staff member editing their OWN row cannot
--       change role, status or bib number. Owner and organizers can.
create or replace function public.prevent_self_role_status_change()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.user_id = auth.uid() and not public.is_owner_of(new.competition_id) then
      new.role := 'competitor';
      if new.status not in ('active', 'waitlisted') then
        new.status := 'active';
      end if;
    end if;
    return new;
  end if;

  if new.user_id = auth.uid()
     and old.role <> 'organizer'
     and not public.is_owner_of(new.competition_id) then
    new.role       := old.role;
    new.status     := old.status;
    new.bib_number := old.bib_number;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_role_status_change on public.competition_members;
create trigger trg_prevent_self_role_status_change
  before insert or update on public.competition_members
  for each row execute function public.prevent_self_role_status_change();


-- ── D. competitions: co-organizers may update; only the owner changes owner_id
drop policy if exists "competitions_update_organizer" on public.competitions;
create policy "competitions_update_organizer" on public.competitions
  for update to authenticated
  using      (public.has_comp_role(id, array['organizer']))
  with check (public.has_comp_role(id, array['organizer']));

create or replace function public.prevent_owner_change()
returns trigger language plpgsql as $$
begin
  if new.owner_id is distinct from old.owner_id
     and auth.uid() is not null
     and old.owner_id <> auth.uid() then
    raise exception 'only the owner can transfer a competition' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_owner_change on public.competitions;
create trigger trg_prevent_owner_change
  before update on public.competitions
  for each row execute function public.prevent_owner_change();


-- ── B. verify_join_password: text id (kept for the currently deployed client)
drop function if exists public.verify_join_password(uuid, text);
create or replace function public.verify_join_password(
  p_competition_id text,
  p_password       text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  stored_password text;
begin
  select data->>'joinPassword' into stored_password
    from public.competitions where id = p_competition_id;
  if stored_password is null or stored_password = '' then
    return true;
  end if;
  return stored_password = coalesce(p_password, '');
end;
$$;
revoke all on function public.verify_join_password(text, text) from public, anon;
grant execute on function public.verify_join_password(text, text) to authenticated;


-- ── C1. Invite lookup that works for private competitions ──────────────────
-- Returns the competition data without secrets, plus hasJoinPassword.
create or replace function public.get_competition_by_invite(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select (data - 'joinPassword' - 'bannedEmails')
         || jsonb_build_object('hasJoinPassword', coalesce(data->>'joinPassword', '') <> '')
    from public.competitions
   where invite_code = upper(trim(p_code))
   limit 1;
$$;
revoke all on function public.get_competition_by_invite(text) from public, anon;
grant execute on function public.get_competition_by_invite(text) to authenticated;


-- ── C2. join_competition: the only way to join as a competitor ─────────────
-- Returns jsonb { status, bib? } where status is one of:
--   joined | already | waitlisted | full | banned | bad_password | not_found
-- The competition row is locked FOR UPDATE, so concurrent joins are
-- serialised: no two people get the same bib, capacity cannot be overshot.
create or replace function public.join_competition(
  p_competition_id text,
  p_password       text    default null,
  p_trait_ids      text[]  default null,
  p_gender         text    default null,
  p_waitlist       boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_email    text;
  v_data     jsonb;
  v_owner    uuid;
  v_member   public.competition_members%rowtype;
  v_has_row  boolean;
  v_pw       text;
  v_limit    integer;
  v_count    integer;
  v_bib      integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select data, owner_id into v_data, v_owner
    from public.competitions
   where id = p_competition_id
   for update;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  select * into v_member
    from public.competition_members
   where competition_id = p_competition_id and user_id = v_uid;
  v_has_row := found;

  -- Already an active member: just update categories / gender if provided.
  if v_has_row and v_member.status = 'active' then
    update public.competition_members
       set trait_ids = coalesce(p_trait_ids, trait_ids),
           gender    = coalesce(nullif(p_gender, ''), gender)
     where competition_id = p_competition_id and user_id = v_uid;
    return jsonb_build_object('status', 'already', 'bib', v_member.bib_number);
  end if;

  -- Banned?
  select lower(email) into v_email from auth.users where id = v_uid;
  if v_email is not null
     and jsonb_typeof(v_data->'bannedEmails') = 'array'
     and (v_data->'bannedEmails') ? v_email then
    return jsonb_build_object('status', 'banned');
  end if;

  -- Password (the owner never needs it)
  v_pw := v_data->>'joinPassword';
  if v_uid <> v_owner and v_pw is not null and v_pw <> '' and coalesce(p_password, '') <> v_pw then
    return jsonb_build_object('status', 'bad_password');
  end if;

  -- Capacity: only enforced when participantLimit is a positive number
  -- (stored either as a JSON number or as a numeric string).
  -- Owner, judges and organizers never count toward the limit.
  v_limit := 0;
  if coalesce(v_data->>'participantLimit', '') ~ '^\s*\d+(\.\d+)?\s*$' then
    v_limit := floor((v_data->>'participantLimit')::numeric)::int;
  end if;
  if v_limit > 0 then
    if coalesce(v_data->>'additionalCapacity', '') ~ '^\s*\d+(\.\d+)?\s*$' then
      v_limit := v_limit + floor((v_data->>'additionalCapacity')::numeric)::int;
    end if;
    select count(*) into v_count
      from public.competition_members
     where competition_id = p_competition_id
       and status = 'active'
       and role   = 'competitor'
       and user_id <> v_owner;
    if v_count >= v_limit then
      if not p_waitlist then
        return jsonb_build_object('status', 'full');
      end if;
      if not v_has_row then
        insert into public.competition_members
          (competition_id, user_id, role, status, bib_number, trait_ids, gender)
        values
          (p_competition_id, v_uid, 'competitor', 'waitlisted', null,
           coalesce(p_trait_ids, '{}'), nullif(p_gender, ''));
      end if;
      return jsonb_build_object('status', 'waitlisted');
    end if;
  end if;

  -- Next bib: max existing + 1, starting at 101.
  select greatest(coalesce(max(bib_number), 100), 100) + 1 into v_bib
    from public.competition_members
   where competition_id = p_competition_id;

  -- A waitlisted row is replaced (the self-edit trigger would otherwise
  -- block the status change).
  if v_has_row then
    delete from public.competition_members
     where competition_id = p_competition_id and user_id = v_uid;
  end if;

  insert into public.competition_members
    (competition_id, user_id, role, status, bib_number, trait_ids, gender)
  values
    (p_competition_id, v_uid, 'competitor', 'active', v_bib,
     coalesce(p_trait_ids, case when v_has_row then v_member.trait_ids end, '{}'),
     coalesce(nullif(p_gender, ''), case when v_has_row then v_member.gender end));

  return jsonb_build_object('status', 'joined', 'bib', v_bib);
end;
$$;
revoke all on function public.join_competition(text, text, text[], text, boolean) from public, anon;
grant execute on function public.join_competition(text, text, text[], text, boolean) to authenticated;


-- ── F. profiles: yourself + people who share a competition with you ────────
create or replace function public.shares_competition_with(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
           select 1
             from public.competition_members me
             join public.competition_members them
               on them.competition_id = me.competition_id
            where me.user_id = auth.uid() and them.user_id = p_user
         )
      or exists (
           select 1
             from public.competitions c
             join public.competition_members them on them.competition_id = c.id
            where c.owner_id = auth.uid() and them.user_id = p_user
         );
$$;
grant execute on function public.shares_competition_with(uuid) to authenticated;

drop policy if exists "Users can read any profile" on public.profiles;
drop policy if exists "profiles_select"            on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.shares_competition_with(id));


-- ── G. payments: read-only for the paying user (writes are server-side) ────
drop policy if exists "payment_owner"  on public.payments;
drop policy if exists "payments_select" on public.payments;
create policy "payments_select" on public.payments
  for select to authenticated
  using (user_id = auth.uid());


-- ── H. No anonymous reads of raw tables ────────────────────────────────────
alter policy "competitions_select" on public.competitions to authenticated;
alter policy "boulder_read"        on public.boulders     to authenticated;
alter policy "completions_select"  on public.completions  to authenticated;
alter policy "members_select"      on public.competition_members to authenticated;


-- ── Public leaderboard: also strip bannedEmails; keep ownerId so the owner
--    is excluded from rankings on the public page too.
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
revoke all on function public.get_public_leaderboard(text) from public;
grant execute on function public.get_public_leaderboard(text) to anon, authenticated;


-- ── I. Realtime: nothing listens to profiles or payments ───────────────────
do $$
begin
  if exists (select 1 from pg_publication_tables
              where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles') then
    alter publication supabase_realtime drop table public.profiles;
  end if;
  if exists (select 1 from pg_publication_tables
              where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'payments') then
    alter publication supabase_realtime drop table public.payments;
  end if;
end $$;

commit;
