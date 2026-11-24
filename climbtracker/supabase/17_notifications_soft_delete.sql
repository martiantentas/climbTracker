-- ============================================================
-- Ascendr — 17 announcements: delete without broadcasting DELETE events
-- Safe to re-run. Apply this BEFORE deploying the matching frontend.
--
-- Why: Supabase Realtime cannot filter DELETE events and does not check
-- row-level security on them, so deleting one announcement (or a whole
-- competition, which cascades) sent a message to every connected app of
-- every competition. UPDATE events can be filtered by competition and are
-- checked per subscriber, so "delete" is now an UPDATE that sets
-- deleted_at. The app stops listening to DELETE events altogether.
--
-- The text is erased in the same statement, so a deleted announcement
-- leaves nothing readable behind. Organizers can only delete, never
-- restore or edit.
-- ============================================================

begin;

alter table public.notifications add column if not exists deleted_at timestamptz;

-- Erase the content when an announcement is deleted.
create or replace function public.notifications_scrub_on_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.deleted_at := now();
  new.title      := '-';
  new.body       := '';
  return new;
end;
$$;

drop trigger if exists trg_notifications_scrub_on_delete on public.notifications;
create trigger trg_notifications_scrub_on_delete
  before update on public.notifications
  for each row
  when (new.deleted_at is not null and old.deleted_at is null)
  execute function public.notifications_scrub_on_delete();

-- Only staff of the competition, only the deleted_at column, only to mark a
-- live announcement as deleted.
revoke update on public.notifications from public, anon, authenticated;
grant update (deleted_at) on public.notifications to authenticated;

drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications
  for update to authenticated
  using (deleted_at is null
         and (public.is_owner_of(competition_id)
              or public.has_comp_role(competition_id, array['organizer'])))
  with check (deleted_at is not null
              and (public.is_owner_of(competition_id)
                   or public.has_comp_role(competition_id, array['organizer'])));

commit;

-- Check (expected: 4 policies, then the trigger and the column)
select policyname from pg_policies where schemaname = 'public' and tablename = 'notifications' order by 1;
select tgname from pg_trigger where tgrelid = 'public.notifications'::regclass and not tgisinternal order by 1;
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'notifications' and column_name = 'deleted_at';
