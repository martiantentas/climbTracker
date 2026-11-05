-- ============================================================
-- Ascendr load test: 03 cleanup (run when you are done)
-- Removes the test competition and every *@ascendr-loadtest.invalid
-- account (also the ones from older load tests). Touches nothing else.
-- ============================================================

begin;

-- Test competition: boulders, members and scores go with it (cascade)
delete from public.competitions where id = 'comp-loadtest';

-- Anything a test account may have left anywhere else
delete from public.completions         where competitor_id in (select id from auth.users where email like '%@ascendr-loadtest.invalid');
delete from public.competition_members where user_id       in (select id from auth.users where email like '%@ascendr-loadtest.invalid');
delete from public.competitions        where owner_id      in (select id from auth.users where email like '%@ascendr-loadtest.invalid');
delete from public.profiles            where id            in (select id from auth.users where email like '%@ascendr-loadtest.invalid');

-- The accounts (identities and sessions go with them)
delete from auth.users where email like '%@ascendr-loadtest.invalid';

commit;

-- Check (expected: 0 · 0 · 1)
select
  (select count(*) from public.competitions where id = 'comp-loadtest')                as competition,
  (select count(*) from auth.users where email like '%@ascendr-loadtest.invalid')      as test_accounts,
  (select count(*) from public.competitions where id = 'comp-1777411314368')           as real_event_still_there;
