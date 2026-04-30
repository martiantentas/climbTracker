import { supabase } from './supabase'
import type { Json } from './database.types'
import type { Competition, Boulder, Completion, Competitor } from '../types'

// ─── RETRY HELPER ─────────────────────────────────────────────────────────────
// Retries any async operation with exponential back-off.
// Delays: 600 ms → 1 200 ms → 2 400 ms (3 attempts total).
// Used for all writes so a transient network glitch doesn't silently lose data.

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 600,
): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try { return await fn() } catch (err) {
      lastErr = err
      if (attempt < maxAttempts - 1)
        await new Promise(r => setTimeout(r, baseDelayMs * 2 ** attempt))
    }
  }
  throw lastErr
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function memberRowToCompetitor(row: {
  user_id: string; role: string; status: string
  bib_number: number | null; trait_ids: string[]; gender: string | null
  profiles: { email: string; display_name: string | null; avatar_url: string | null; emoji: string | null } | null
}): Competitor {
  const profile     = row.profiles
  const displayName = profile?.display_name ?? profile?.email ?? ''
  const parts       = displayName.trim().split(' ')
  return {
    id:          row.user_id,
    email:       profile?.email ?? '',
    firstName:   parts[0] ?? '',
    lastName:    parts.slice(1).join(' '),
    displayName,
    avatar:      profile?.avatar_url  ?? undefined,
    emoji:       profile?.emoji       ?? undefined,
    gender:      row.gender           ?? '',
    traitIds:    row.trait_ids        ?? [],
    bibNumber:   row.bib_number       ?? 0,
    role:        row.role as 'competitor' | 'judge' | 'organizer',
  } as Competitor & { emoji?: string }
}

// ─── COMPETITIONS ─────────────────────────────────────────────────────────────

export async function fetchUserCompetitions(userId: string): Promise<Competition[]> {
  const [ownedRes, membershipsRes, publicRes] = await Promise.all([
    supabase
      .from('competitions')
      .select('data')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('competition_members')
      .select('competition_id')
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase
      .from('competitions')
      .select('data')
      .eq('visibility', 'public')
      .neq('owner_id', userId)
      .order('created_at', { ascending: false }),
  ])

  if (ownedRes.error)       throw ownedRes.error
  if (membershipsRes.error) throw membershipsRes.error
  const publicComps = publicRes.data ?? []

  const memberIds = (membershipsRes.data ?? []).map(m => m.competition_id)
  let memberComps: Competition[] = []
  if (memberIds.length > 0) {
    const { data, error: e3 } = await supabase
      .from('competitions')
      .select('data')
      .in('id', memberIds)
      .neq('owner_id', userId)
      .order('created_at', { ascending: false })
    if (e3) throw e3
    memberComps = (data ?? []).map(r => r.data as unknown as Competition)
  }

  const seen = new Set<string>()
  const result: Competition[] = []
  for (const comp of [
    ...(ownedRes.data ?? []).map(r => r.data as unknown as Competition),
    ...memberComps,
    ...publicComps.map(r => r.data as unknown as Competition),
  ]) {
    if (!seen.has(comp.id)) { seen.add(comp.id); result.push(comp) }
  }
  return result
}

export async function upsertCompetition(comp: Competition): Promise<void> {
  const { error } = await supabase
    .from('competitions')
    .upsert({
      id:          comp.id,
      owner_id:    comp.ownerId,
      status:      comp.status,
      visibility:  comp.visibility,
      invite_code: comp.inviteCode ?? null,
      data:        comp as unknown as Json,
    })
  if (error) throw error
}

export async function deleteCompetition(compId: string): Promise<void> {
  const { error } = await supabase.from('competitions').delete().eq('id', compId)
  if (error) throw error
}

export async function fetchCompetitionByInviteCode(code: string): Promise<Competition | null> {
  const { data, error } = await supabase
    .from('competitions')
    .select('data')
    .eq('invite_code', code.toUpperCase())
    .maybeSingle()
  if (error || !data) return null
  return data.data as unknown as Competition
}

// ─── BOULDERS ─────────────────────────────────────────────────────────────────

export async function fetchBoulders(competitionId: string): Promise<Boulder[]> {
  const { data, error } = await supabase
    .from('boulders')
    .select('data')
    .eq('competition_id', competitionId)
    .order('position', { ascending: true })
  if (error) throw error
  return (data ?? []).map(r => r.data as unknown as Boulder)
}

// Fetch boulders for multiple competitions in a single query instead of one
// query per competition. At login with N competitions this goes from N queries
// to 1.  Returns a map keyed by competition ID.
export async function fetchAllBouldersForComps(ids: string[]): Promise<Record<string, Boulder[]>> {
  if (ids.length === 0) return {}
  const { data, error } = await supabase
    .from('boulders')
    .select('competition_id, data, position')
    .in('competition_id', ids)
    .order('position', { ascending: true })
  if (error) throw error
  const result: Record<string, Boulder[]> = Object.fromEntries(ids.map(id => [id, []]))
  for (const row of data ?? []) result[row.competition_id].push(row.data as unknown as Boulder)
  return result
}

export async function upsertBoulders(competitionId: string, boulders: Boulder[]): Promise<void> {
  const { error: delErr } = await supabase
    .from('boulders')
    .delete()
    .eq('competition_id', competitionId)
  if (delErr) throw delErr
  if (boulders.length === 0) return
  const { error } = await supabase.from('boulders').insert(
    boulders.map((b, idx) => ({
      id:             b.id,
      competition_id: competitionId,
      position:       idx,
      data:           b as unknown as Json,
    }))
  )
  if (error) throw error
}

// ─── COMPLETIONS ──────────────────────────────────────────────────────────────

export async function fetchCompletions(competitionId: string): Promise<Completion[]> {
  const { data, error } = await supabase
    .from('completions')
    .select('data')
    .eq('competition_id', competitionId)
  if (error) throw error
  return (data ?? []).map(r => r.data as unknown as Completion)
}

// Fetch completions for multiple competitions in one query.
// Used by the health-check polling fallback and for bulk hydration.
export async function fetchAllCompletionsForComps(ids: string[]): Promise<Record<string, Completion[]>> {
  if (ids.length === 0) return {}
  const { data, error } = await supabase
    .from('completions')
    .select('competition_id, data')
    .in('competition_id', ids)
  if (error) throw error
  const result: Record<string, Completion[]> = Object.fromEntries(ids.map(id => [id, []]))
  for (const row of data ?? []) result[row.competition_id].push(row.data as unknown as Completion)
  return result
}

// Wrapped with retry so a transient network blip doesn't silently lose a score.
export async function upsertCompletion(competitionId: string, completion: Completion): Promise<void> {
  await withRetry(() =>
    supabase
      .from('completions')
      .upsert({
        competition_id: competitionId,
        competitor_id:  completion.competitorId,
        boulder_id:     completion.boulderId,
        data:           completion as unknown as Json,
      })
      .throwOnError()
  )
}

export async function deleteCompletion(
  competitionId: string, competitorId: string, boulderId: string
): Promise<void> {
  await withRetry(() =>
    supabase
      .from('completions')
      .delete()
      .match({ competition_id: competitionId, competitor_id: competitorId, boulder_id: boulderId })
      .throwOnError()
  )
}

// ─── COMPETITION MEMBERS ──────────────────────────────────────────────────────

// Single-competition fetch (used by real-time INSERT handler, join flow, etc.)
async function fetchMembersByStatus(competitionId: string, status: string): Promise<Competitor[]> {
  const { data: rows, error: e1 } = await supabase
    .from('competition_members')
    .select('user_id, role, status, bib_number, trait_ids, gender')
    .eq('competition_id', competitionId)
    .eq('status', status)
  if (e1) throw e1
  if (!rows || rows.length === 0) return []

  const userIds = rows.map(r => r.user_id)
  const { data: profiles, error: e2 } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url, emoji')
    .in('id', userIds)
  if (e2) throw e2

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  return rows.map(row => memberRowToCompetitor({ ...row, profiles: profileMap[row.user_id] ?? null }))
}

// Multi-competition fetch — 2 queries regardless of how many competitions.
// At login with N competitions this goes from 2×N queries to 2.
// Returns a map keyed by competition ID.
async function fetchAllMembersByStatus(ids: string[], status: string): Promise<Record<string, Competitor[]>> {
  if (ids.length === 0) return {}
  const { data: rows, error: e1 } = await supabase
    .from('competition_members')
    .select('competition_id, user_id, role, status, bib_number, trait_ids, gender')
    .in('competition_id', ids)
    .eq('status', status)
  if (e1) throw e1

  const result: Record<string, Competitor[]> = Object.fromEntries(ids.map(id => [id, []]))
  if (!rows || rows.length === 0) return result

  const userIds = [...new Set(rows.map(r => r.user_id))]
  const { data: profiles, error: e2 } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url, emoji')
    .in('id', userIds)
  if (e2) throw e2

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  for (const row of rows) {
    result[row.competition_id].push(
      memberRowToCompetitor({ ...row, profiles: profileMap[row.user_id] ?? null })
    )
  }
  return result
}

export async function fetchMembers(competitionId: string): Promise<Competitor[]> {
  return fetchMembersByStatus(competitionId, 'active')
}

export async function fetchWaitlist(competitionId: string): Promise<Competitor[]> {
  return fetchMembersByStatus(competitionId, 'waitlisted')
}

export async function upsertMember(
  competitionId: string,
  userId: string,
  fields: { role?: string; status?: string; bib_number?: number | null; trait_ids?: string[]; gender?: string | null }
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('competition_members').upsert({
    competition_id: competitionId,
    user_id:        userId,
    trait_ids:      [],
    ...fields,
  } as any)
  if (error) throw error
}

export async function deleteMember(competitionId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('competition_members')
    .delete()
    .match({ competition_id: competitionId, user_id: userId })
  if (error) throw error
}

// ─── BULK LOADER ──────────────────────────────────────────────────────────────
// Called once on login. Key design decisions:
//
//   1. Batch queries — boulders, members, waitlists each cost 1–2 DB round-trips
//      regardless of how many competitions exist (was previously N round-trips each).
//
//   2. Lazy completions — completions are only fetched for the competition that
//      will be visible on screen (preferredActiveId or the first one). All others
//      are fetched on demand when the user switches to them (see the lazy-load
//      useEffect in App.tsx). This avoids downloading potentially hundreds of
//      thousands of rows that are never displayed.
//
// Query budget before this change: 5 × N  (N = number of competitions)
// Query budget after this change:  6 total (boulders×1, members×2, waitlist×2, completions×1)

export async function loadAllUserData(
  userId: string,
  preferredActiveId?: string,
): Promise<{
  comps:       Competition[]
  boulders:    Record<string, Boulder[]>
  completions: Record<string, Completion[]>
  members:     Record<string, Competitor[]>
  waitlists:   Record<string, Competitor[]>
  activeId:    string   // the competition whose completions were pre-fetched
}> {
  const comps = await fetchUserCompetitions(userId)
  if (comps.length === 0) {
    return { comps: [], boulders: {}, completions: {}, members: {}, waitlists: {}, activeId: '' }
  }

  const ids      = comps.map(c => c.id)
  const activeId = (preferredActiveId && ids.includes(preferredActiveId))
    ? preferredActiveId
    : ids[0]

  const [boulders, members, waitlists, activeCompletions] = await Promise.all([
    fetchAllBouldersForComps(ids),
    fetchAllMembersByStatus(ids, 'active'),
    fetchAllMembersByStatus(ids, 'waitlisted'),
    fetchCompletions(activeId),
  ])

  const completions: Record<string, Completion[]> = Object.fromEntries(ids.map(id => [id, []]))
  completions[activeId] = activeCompletions

  return { comps, boulders, completions, members, waitlists, activeId }
}
