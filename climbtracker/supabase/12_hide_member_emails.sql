-- ============================================================
-- Ascendr — 12 hide member emails
-- Run ONLY AFTER the frontend that no longer selects profiles.email is live.
-- (The previous frontend runs `select *` on profiles: after this migration
-- that query fails and login would break.) Safe to re-run.
--
-- Before: any member could read the email of every member of their
-- competition (profiles.email via the API).
-- After:
--   • the API never returns profiles.email to anyone (column privilege)
--   • users cannot change profiles.email either
--   • owners and organizers get their members' emails through
--     get_member_emails(), and only for competitions they manage
--   • your own email still comes from your login session (not from profiles)
-- ============================================================

begin;

-- Read: every column except email.
revoke select on public.profiles from anon, authenticated;
grant  select (id, display_name, avatar_url, emoji, lang, theme, location, bio,
               trait_ids, created_at, updated_at)
  on public.profiles to authenticated;

-- Write: only the editable profile fields (never id or email).
revoke insert, update, delete on public.profiles from anon, authenticated;
grant  update (display_name, avatar_url, emoji, lang, theme, location, bio, trait_ids)
  on public.profiles to authenticated;

-- Emails for staff: owner or active organizer of the competition only.
create or replace function public.get_member_emails(p_competition_ids text[])
returns table (competition_id text, user_id uuid, email text)
language sql
stable
security definer
set search_path = public
as $$
  select m.competition_id, m.user_id, coalesce(u.email, p.email) as email
    from public.competition_members m
    left join auth.users      u on u.id = m.user_id
    left join public.profiles p on p.id = m.user_id
   where m.competition_id = any(p_competition_ids)
     and (public.is_owner_of(m.competition_id)
          or public.has_comp_role(m.competition_id, array['organizer']));
$$;
revoke all on function public.get_member_emails(text[]) from public, anon;
grant execute on function public.get_member_emails(text[]) to authenticated;

commit;
