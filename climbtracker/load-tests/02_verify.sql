-- ============================================================
-- Ascendr load test: 02 verify (run AFTER k6, BEFORE cleanup)
-- Every check should return ok = true.
-- ============================================================

with m as (
  select * from public.competition_members where competition_id = 'comp-loadtest'
), k6 as (
  select m.* from m join auth.users u on u.id = m.user_id
   where u.email like 'lt-___@ascendr-loadtest.invalid'
)
select 'k6 competitors joined as competitor (never another role)' as check,
       (select count(*) from k6) as value,
       (select count(*) from k6 where role <> 'competitor') = 0 as ok
union all
select 'no duplicate bib numbers',
       (select count(*) from (select bib_number from m where role = 'competitor'
                               group by bib_number having count(*) > 1) d),
       (select count(*) from (select bib_number from m where role = 'competitor'
                               group by bib_number having count(*) > 1) d) = 0
union all
select 'every active competitor has a bib',
       (select count(*) from m where role = 'competitor' and status = 'active' and bib_number is null),
       (select count(*) from m where role = 'competitor' and status = 'active' and bib_number is null) = 0
union all
select 'capacity not exceeded (limit 800)',
       (select count(*) from m where role = 'competitor' and status = 'active'),
       (select count(*) from m where role = 'competitor' and status = 'active') <= 800
union all
select 'no self-scores on judge-only boulders (written by k6 competitors)',
       (select count(*) from public.completions c
          join public.boulders b on b.id = c.boulder_id
          join k6 on k6.user_id = c.competitor_id
         where c.competition_id = 'comp-loadtest'
           and (b.data->>'isPuntuable')::boolean
           and c.data->>'topValidatedBy' is null
           and coalesce((c.data->>'topValidated')::boolean, false)),
       (select count(*) from public.completions c
          join public.boulders b on b.id = c.boulder_id
          join k6 on k6.user_id = c.competitor_id
         where c.competition_id = 'comp-loadtest'
           and (b.data->>'isPuntuable')::boolean
           and c.data->>'topValidatedBy' is null
           and coalesce((c.data->>'topValidated')::boolean, false)) = 0
union all
select 'scores stored for k6 competitors (should be > 0)',
       (select count(*) from public.completions c join k6 on k6.user_id = c.competitor_id
         where c.competition_id = 'comp-loadtest'),
       (select count(*) from public.completions c join k6 on k6.user_id = c.competitor_id
         where c.competition_id = 'comp-loadtest') > 0
union all
select 'real event untouched: no test accounts in comp-1777411314368',
       (select count(*) from public.competition_members cm join auth.users u on u.id = cm.user_id
         where cm.competition_id = 'comp-1777411314368' and u.email like '%@ascendr-loadtest.invalid'),
       (select count(*) from public.competition_members cm join auth.users u on u.id = cm.user_id
         where cm.competition_id = 'comp-1777411314368' and u.email like '%@ascendr-loadtest.invalid') = 0;
