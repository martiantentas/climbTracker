-- ============================================================
-- Ascendr — neteja dades de prova de càrrega
-- Executa SEMPRE al final de les proves
-- ============================================================

-- Elimina completions de test
delete from public.completions
where competition_id = 'comp-1777411314368'
  and boulder_id like 'boulder-test-%';

-- Elimina boulders de test
delete from public.boulders
where competition_id = 'comp-1777411314368'
  and id like 'boulder-test-%';

-- Elimina members de test
delete from public.competition_members
where competition_id = 'comp-1777411314368'
  and user_id in (
    select id from auth.users
    where email like '%@ascendr-loadtest.invalid'
  );

-- Elimina usuaris de test
delete from auth.users
where email like '%@ascendr-loadtest.invalid';

select 'Cleanup complet' as status;
