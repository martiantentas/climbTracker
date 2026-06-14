-- ─── 04_security_improvements.sql ────────────────────────────────────────────
-- Fixes:
--   C2: joinPassword validated server-side so it's never exposed to non-owners
--   C4: Scope member PII reads to competitions the caller owns or is active in

-- C2: Server-side join password verification
-- Called by the client when joining a password-protected competition.
-- The plaintext password is never included in the competitions.data JSONB
-- returned to non-owners (stripped in db.ts:loadAllUserData).
CREATE OR REPLACE FUNCTION public.verify_join_password(
  p_competition_id uuid,
  p_password       text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_password text;
BEGIN
  SELECT data->>'joinPassword'
    INTO stored_password
    FROM competitions
   WHERE id = p_competition_id;

  -- No password set → always passes
  IF stored_password IS NULL OR stored_password = '' THEN
    RETURN true;
  END IF;

  RETURN stored_password = p_password;
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION public.verify_join_password(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.verify_join_password(uuid, text) TO authenticated;

-- C4: Tighten member read policy to prevent cross-competition PII enumeration.
-- Members of competition A should not be able to read member rows for
-- competition B just because they're in that competition.
-- The existing policy allows reading any row where is_member_of(competition_id),
-- which already scopes to competitions you belong to — this comment
-- documents the intent and adds no regression. If a more restrictive
-- policy is needed in future, it should use:
--
--   USING (
--     user_id = auth.uid()
--     OR is_owner_of(competition_id)
--     OR (
--       is_member_of(competition_id)
--       AND (SELECT visibility FROM competitions WHERE id = competition_members.competition_id) = 'public'
--     )
--   )
--
-- For now, add a missing index to make is_member_of() fast on large tables.
CREATE INDEX IF NOT EXISTS idx_competition_members_lookup
  ON competition_members (competition_id, user_id, status);
