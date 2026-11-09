import { supabase } from './supabase'
import type { Competitor } from '../types'
import { translations } from '../translations'

// ─── TYPES ────────────────────────────────────────────────────────────────────

// Who an announcement is for. Every empty list means "everyone"; lists combine
// with AND, values inside one list with OR (same rule as the database policy
// in 16_notifications.sql).
export interface NotificationAudience {
  roles:   string[]   // 'competitor' | 'judge' | 'organizer'
  traits:  string[]   // competition.traits ids
  genders: string[]   // stored gender values
  bibs:    number[]
}

export type AutoKind = 'top_validated' | 'results_locked' | 'status_live' | 'status_finished'

export interface AppNotification {
  id:         string
  kind:       'announcement' | AutoKind
  title:      string
  body:       string
  createdAt:  number
  createdBy?: string
  audience?:  NotificationAudience
  // Automatic notices only: values used to build the translated text
  params?:    Record<string, string | number>
}

export const EMPTY_AUDIENCE: NotificationAudience = { roles: [], traits: [], genders: [], bibs: [] }

// ─── DATABASE ─────────────────────────────────────────────────────────────────

interface NotificationRow {
  id: string; competition_id: string; title: string; body: string
  target_roles: string[]; target_traits: string[]; target_genders: string[]; target_bibs: number[]
  created_by: string | null; created_at: string
}

// The generated database types do not include this table yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (supabase as any).from('notifications')

export function rowToNotification(row: NotificationRow): AppNotification {
  return {
    id:        row.id,
    kind:      'announcement',
    title:     row.title,
    body:      row.body ?? '',
    createdAt: new Date(row.created_at).getTime(),
    createdBy: row.created_by ?? undefined,
    audience:  {
      roles:   row.target_roles   ?? [],
      traits:  row.target_traits  ?? [],
      genders: row.target_genders ?? [],
      bibs:    row.target_bibs    ?? [],
    },
  }
}

// Latest announcements visible to the current user (the database only
// returns the ones addressed to them).
export async function fetchNotifications(competitionId: string): Promise<AppNotification[]> {
  const { data, error } = await table()
    .select('id, competition_id, title, body, target_roles, target_traits, target_genders, target_bibs, created_by, created_at')
    .eq('competition_id', competitionId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return ((data ?? []) as NotificationRow[]).map(rowToNotification)
}

export async function sendNotification(
  competitionId: string,
  title: string,
  body: string,
  audience: NotificationAudience,
): Promise<AppNotification> {
  const { data, error } = await table()
    .insert({
      competition_id: competitionId,
      title:          title.trim(),
      body:           body.trim(),
      target_roles:   audience.roles,
      target_traits:  audience.traits,
      target_genders: audience.genders,
      target_bibs:    audience.bibs,
    })
    .select('id, competition_id, title, body, target_roles, target_traits, target_genders, target_bibs, created_by, created_at')
    .single()
  if (error) throw error
  return rowToNotification(data as NotificationRow)
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await table().delete().eq('id', id)
  if (error) throw error
}

// ─── AUDIENCE ─────────────────────────────────────────────────────────────────

// "101-120, 135 140" → [101..120, 135, 140]. Returns null when the text is
// not valid or asks for more than 2000 numbers (database limit).
export function parseBibs(text: string): number[] | null {
  const out = new Set<number>()
  const parts = text.split(/[\s,;]+/).filter(Boolean)
  for (const p of parts) {
    const m = p.match(/^(\d+)(?:-(\d+))?$/)
    if (!m) return null
    const a = Number(m[1])
    const b = m[2] === undefined ? a : Number(m[2])
    if (b < a || b - a > 2000) return null
    for (let n = a; n <= b; n++) out.add(n)
    if (out.size > 2000) return null
  }
  return [...out].sort((x, y) => x - y)
}

// Same rule as public.notification_visible() for a member of the competition.
export function memberMatches(m: Competitor, a: NotificationAudience): boolean {
  const role = m.role ?? 'competitor'
  if (a.roles.length   && !a.roles.includes(role)) return false
  if (a.traits.length  && !(m.traitIds ?? []).some(id => a.traits.includes(id))) return false
  if (a.genders.length && !(m.gender && a.genders.includes(m.gender))) return false
  if (a.bibs.length    && !(m.bibNumber != null && a.bibs.includes(m.bibNumber))) return false
  return true
}

export function isEveryone(a: NotificationAudience | undefined): boolean {
  return !a || (!a.roles.length && !a.traits.length && !a.genders.length && !a.bibs.length)
}

// Gender is stored as the label shown at sign-up, in the language the person
// was using ("Female", "Femenino", "Femení"). Group the three spellings so the
// organizer picks "Female" once. Unknown values become their own group.
export function genderGroups(values: string[], label: (key: 'profileMale' | 'profileFemale' | 'profileOther') => string) {
  const keys = ['profileMale', 'profileFemale', 'profileOther'] as const
  const groups = keys.map(k => ({
    key:    k,
    label:  label(k),
    values: [...new Set<string>(Object.values(translations).map(t => t[k]))],
  }))
  const known = new Set<string>(groups.flatMap(g => g.values))
  const extra = [...new Set(values.filter(v => v && !known.has(v)))]
    .map(v => ({ key: v, label: v, values: [v] }))
  return [...groups, ...extra]
}

// ─── LOCAL STATE (per device) ─────────────────────────────────────────────────

const LOCAL_MAX = 50
const READ_MAX  = 300

function localKey(userId: string, compId: string) { return `ct-notif-local:${userId}:${compId}` }
function readKey(userId: string, compId: string)  { return `ct-notif-read:${userId}:${compId}` }

// Automatic notices are kept on the device that produced them.
export function loadLocal(userId: string, compId: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(localKey(userId, compId))
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch { return [] }
}

export function saveLocal(userId: string, compId: string, list: AppNotification[]) {
  try { localStorage.setItem(localKey(userId, compId), JSON.stringify(list.slice(0, LOCAL_MAX))) } catch { /* storage full or blocked */ }
}

// Ids the user has already read on this device.
export function loadRead(userId: string, compId: string): Set<string> {
  try {
    const raw = localStorage.getItem(readKey(userId, compId))
    const list = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(list) ? list : [])
  } catch { return new Set() }
}

export function saveRead(userId: string, compId: string, ids: Set<string>) {
  try { localStorage.setItem(readKey(userId, compId), JSON.stringify([...ids].slice(-READ_MAX))) } catch { /* ignore */ }
}
