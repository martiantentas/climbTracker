-- ============================================================
-- Ascendr — 11 dynamic pot cleanup (data fix, safe to re-run)
--
-- The boulder editor used to copy the competition's dynamic pot into every
-- boulder it saved (data.maxPoints), even when nobody changed it. Those
-- boulders then ignored later changes to the competition's pot.
-- This removes maxPoints ONLY where it equals the competition pot (or the
-- 1000 default), so today's scores are identical and future pot changes
-- apply to them. Boulders with a genuinely different pot keep it.
-- ============================================================

update public.boulders b
   set data = b.data - 'maxPoints'
  from public.competitions c
 where c.id = b.competition_id
   and b.data ? 'maxPoints'
   and (b.data->>'maxPoints') ~ '^\s*\d+(\.\d+)?\s*$'
   and (b.data->>'maxPoints')::numeric =
       coalesce(nullif(c.data->>'dynamicPot', '')::numeric, 1000);
