-- ============================================================
-- Ascendr — 09 bib numbering fix
-- Apply AFTER 07. Safe to re-run (create or replace).
--
-- join_competition() assigned "highest bib in the competition + 1", so an
-- organizer with bib 1000 made every new competitor start at 1001.
-- Now: highest COMPETITOR bib + 1 (from 101), skipping any number already
-- used by someone in the competition. Nothing else changes.
-- ============================================================

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

  -- Next bib: highest COMPETITOR bib + 1 (starting at 101). Staff bibs
  -- (organizers/judges often have 0, 999, 1000...) are ignored, but a number
  -- already held by anyone in the competition is never reused.
  select greatest(coalesce(max(bib_number), 100), 100) + 1 into v_bib
    from public.competition_members
   where competition_id = p_competition_id
     and role = 'competitor'
     and status = 'active';
  while exists (select 1 from public.competition_members
                 where competition_id = p_competition_id and bib_number = v_bib) loop
    v_bib := v_bib + 1;
  end loop;

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
