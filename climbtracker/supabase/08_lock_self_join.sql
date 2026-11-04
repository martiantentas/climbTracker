-- ============================================================
-- Ascendr — 08 lock self-join
-- Run ONLY AFTER the frontend that uses join_competition() is deployed
-- (branch fix/pre-launch). Running it earlier breaks joining for the old
-- client, which inserts competition_members rows directly.
--
-- After this, the only way to join a competition as a competitor is the
-- join_competition() RPC, which enforces password, bans, capacity and
-- assigns unique bib numbers.
-- ============================================================

drop policy if exists "members_self_insert" on public.competition_members;
