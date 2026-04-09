import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import type { Competitor } from '../types'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type RequiredRole = 'any' | 'judge_or_organizer' | 'organizer'

interface ProtectedRouteProps {
  currentUser:       Competitor | null
  isOrganizer:       boolean
  canAccessComp:     boolean   // registered or organizer
  required:          RequiredRole
  children:          React.ReactNode
  onAccessDenied?:   (msg: string) => void
}

// ─── ROLE RESOLUTION ─────────────────────────────────────────────────────────

function hasAccess(
  user:          Competitor | null,
  isOrganizer:   boolean,
  canAccessComp: boolean,
  required:      RequiredRole,
): boolean {
  if (!user) return false

  switch (required) {
    case 'any':
      // Must be registered or organizer
      return canAccessComp

    case 'judge_or_organizer':
      return isOrganizer || user.role === 'judge' || user.role === 'organizer'

    case 'organizer':
      return isOrganizer || user.role === 'organizer'
  }
}

const DENIAL_MESSAGES: Record<RequiredRole, string> = {
  any:                'You must be registered for this competition to access that page.',
  judge_or_organizer: 'That page is only available to judges and organizers.',
  organizer:          'That page is only available to organizers.',
}

// ─── PROTECTED ROUTE ─────────────────────────────────────────────────────────

export default function ProtectedRoute({
  currentUser,
  isOrganizer,
  canAccessComp,
  required,
  children,
  onAccessDenied,
}: ProtectedRouteProps) {
  const allowed = hasAccess(currentUser, isOrganizer, canAccessComp, required)

  // Fire the denial callback once on mount if access is denied.
  // useRef prevents it from firing again on re-renders.
  const firedRef = useRef(false)
  useEffect(() => {
    if (!allowed && onAccessDenied && !firedRef.current) {
      firedRef.current = true
      onAccessDenied(DENIAL_MESSAGES[required])
    }
  }, [allowed, onAccessDenied, required])

  if (!allowed) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}