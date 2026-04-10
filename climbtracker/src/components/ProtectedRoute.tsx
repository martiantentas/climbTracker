import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import type { Competitor } from '../types'

export type RequiredRole = 'any' | 'judge_or_organizer' | 'organizer'

interface ProtectedRouteProps {
  currentUser:     Competitor | null
  isOrganizer:     boolean
  canAccessComp:   boolean
  required:        RequiredRole
  children:        React.ReactNode
  onAccessDenied?: (msg: string) => void
}

function hasAccess(
  user:          Competitor | null,
  isOrganizer:   boolean,
  canAccessComp: boolean,
  required:      RequiredRole,
): boolean {
  if (!user) return false
  switch (required) {
    case 'any':                return canAccessComp
    case 'judge_or_organizer': return isOrganizer || user.role === 'judge' || user.role === 'organizer'
    case 'organizer':          return isOrganizer || user.role === 'organizer'
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
  canAccessComp,
  required,
  children,
  onAccessDenied,
}: ProtectedRouteProps) {
  const allowed  = hasAccess(currentUser, isOrganizer, canAccessComp, required)
  const firedRef = useRef(false)

  useEffect(() => {
    if (!allowed && onAccessDenied && !firedRef.current) {
      firedRef.current = true
      onAccessDenied(DENIAL_MESSAGES[required])
    }
  }, [allowed, onAccessDenied, required])

  if (!allowed) {
    // /competitions is always reachable for any logged-in user regardless of
    // role or registration status, so it is the safe fallback for all cases.
    return <Navigate to="/competitions" replace />
  }

  return <>{children}</>
}