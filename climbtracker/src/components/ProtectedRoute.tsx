import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import type { Competitor } from '../types'

export type RequiredRole = 'any' | 'judge_or_organizer' | 'organizer'

interface ProtectedRouteProps {
  currentUser:     Competitor | null
  isOrganizer:     boolean
  isJudge:         boolean
  canAccessComp:   boolean
  required:        RequiredRole
  children:        React.ReactNode
  onAccessDenied?: (msg: string) => void
  lang:            string
}

// All access decisions are based solely on competition-specific flags computed in
// AppInner (isOrganizer, isJudge, canAccessComp). The global currentUser.role is
// intentionally ignored here — it can be stale/mismatched when a user participates
// in multiple competitions with different roles.
function hasAccess(
  user:          Competitor | null,
  isOrganizer:   boolean,
  isJudge:       boolean,
  canAccessComp: boolean,
  required:      RequiredRole,
): boolean {
  if (!user) return false
  switch (required) {
    case 'any':                return isOrganizer || isJudge || canAccessComp
    case 'judge_or_organizer': return isOrganizer || isJudge
    case 'organizer':          return isOrganizer
  }
}

const DENIAL_MESSAGES: Record<RequiredRole, string> = {
  any:                'You must be registered for this competition to access that page.',
  judge_or_organizer: 'That page is only available to judges and organizers.',
  organizer:          'That page is only available to organizers.',
}

export default function ProtectedRoute({
  currentUser,
  isOrganizer,
  isJudge,
  canAccessComp,
  required,
  children,
  onAccessDenied,
  lang,
}: ProtectedRouteProps) {
  const allowed  = hasAccess(currentUser, isOrganizer, isJudge, canAccessComp, required)
  const firedRef = useRef(false)

  useEffect(() => {
    if (!allowed && onAccessDenied && !firedRef.current) {
      firedRef.current = true
      onAccessDenied(DENIAL_MESSAGES[required])
    }
  }, [allowed, onAccessDenied, required])

  if (!allowed) {
    return <Navigate to={`/${lang}/competitions`} replace />
  }

  return <>{children}</>
}
