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
  maxDelayMs  = 8_000,
  cancel?:     AbortSignal,   // once aborted, no further attempt is made
): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (cancel?.aborted) throw cancel.reason ?? new Error('cancelled')
    try { return await fn() } catch (err) {
      lastErr = err
      if (cancel?.aborted) throw cancel.reason ?? new Error('cancelled')
      // The database said "not allowed": retrying will not change that.
      if (isPermissionError(err)) throw err
      if (attempt < maxAttempts - 1)
        await new Promise(r => setTimeout(r, Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)))
    }
  }
  throw lastErr
}

// True when the database refused the write because of the access rules
// (competition finished/locked, judge-required boulder, not a member...).
export function isPermissionError(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  return e?.code === '42501' || /row-level security|permission denied/i.test(e?.message ?? '')
}

// One signal that aborts when any of the given signals aborts.
function anySignal(signals: (AbortSignal | undefined)[]): AbortSignal {
  const ctrl = new AbortController()
  for (const sig of signals) {
    if (!sig) continue
    if (sig.aborted) { ctrl.abort(sig.reason); break }
    sig.addEventListener('abort', () => ctrl.abort(sig.reason), { once: true })
  }
  return ctrl.signal
}

// Abort a request that hangs (gym Wi-Fi often accepts the connection and
// then never answers). Without this a score write could wait forever.
function timeoutSignal(ms: number): AbortSignal {
  const ctrl = new AbortController()
  setTimeout(() => ctrl.abort(new Error('timeout')), ms)
  return ctrl.signal
}

// Score writes: 6 attempts over ~17 s (0.6 + 1.2 + 2.4 + 4.8 + 8 s), each
// attempt limited to 10 s. Upserts and deletes are idempotent, so retrying
// a write that actually succeeded is harmless.
const SCORE_WRITE_ATTEMPTS = 6
const SCORE_WRITE_TIMEOUT  = 10_000

// ─── PAGINATION ───────────────────────────────────────────────────────────────
// PostgREST caps every response at the project's "Max rows" setting (1000 by
// default) and silently drops the rest. Any table that can grow past that
// (completions: competitors × boulders) must be read page by page.

const PAGE_SIZE = 1000

async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1)
    if (error) throw error
    const rows = data ?? []
    out.push(...rows)
    if (rows.length < PAGE_SIZE) return out
  }
}

// Long `.in('id', [...])` lists turn into very long URLs (300 UUIDs ≈ 11 KB),
// which gateways can reject. Split them into small batches.
function chunk<T>(items: T[], size = 100): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

// Emails are NOT part of the public profile (see 12_hide_member_emails.sql).
type ProfileRow = { id: string; display_name: string | null; avatar_url: string | null; emoji: string | null }

async function fetchProfiles(userIds: string[]): Promise<Record<string, ProfileRow>> {
  const batches = await Promise.all(chunk(userIds).map(async ids => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, emoji')
      .in('id', ids)
    if (error) throw error
    return (data ?? []) as ProfileRow[]
  }))
  return Object.fromEntries(batches.flat().map(p => [p.id, p]))
}

// Members' emails, only for competitions the caller owns or organizes
// (get_member_emails RPC). Everyone else gets an empty map. Never fails the
// caller: if the RPC is missing or errors, emails are simply not shown.
async function fetchMemberEmails(competitionIds: string[]): Promise<Record<string, string>> {
  if (competitionIds.length === 0) return {}
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_member_emails', { p_competition_ids: competitionIds })
    if (error) { console.warn('[db] get_member_emails:', error.message); return {} }
    return Object.fromEntries(((data ?? []) as { competition_id: string; user_id: string; email: string }[])
      .map(r => [`${r.competition_id}:${r.user_id}`, r.email ?? '']))
  } catch (err) {
    console.warn('[db] get_member_emails:', err)
    return {}
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function memberRowToCompetitor(row: {
  user_id: string; role: string; status: string
  bib_number: number | null; trait_ids: string[]; gender: string | null
  profiles: { display_name: string | null; avatar_url: string | null; emoji: string | null } | null
}, email = ''): Competitor {
  const profile     = row.profiles
  // No email fallback any more (emails are private): use the bib instead.
  const displayName = profile?.display_name?.trim()
    || (row.bib_number && row.bib_number > 0 ? `#${row.bib_number}` : '—')
  const parts       = displayName.trim().split(' ')
  return {
    id:          row.user_id,
    email,
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

// Fields that only exist in local state and must never be written to the DB.
function toDbData(comp: Competition): Json {
  const rest: Record<string, unknown> = { ...comp }
  delete rest._hasJoinPassword
  delete rest.hasJoinPassword
  return rest as unknown as Json
}

// Used ONLY to create a new competition (create / clone).
// Editing an existing competition must use updateCompetition(): an upsert is
// checked against the INSERT policy (owner only), so co-organizers would be
// rejected even though they are allowed to update.
export async function upsertCompetition(comp: Competition): Promise<void> {
  const { error } = await supabase
    .from('competitions')
    .upsert({
      id:          comp.id,
      owner_id:    comp.ownerId,
      status:      comp.status,
      visibility:  comp.visibility,
      invite_code: comp.inviteCode ?? null,
      data:        toDbData(comp),
    })
  if (error) throw error
}

// Save changes to an existing competition (owner or co-organizer).
// Throws if the database did not accept the change (e.g. no permission),
// so the UI can tell the user instead of showing a false "saved".
export async function updateCompetition(comp: Competition): Promise<void> {
  const { data, error } = await supabase
    .from('competitions')
    .update({
      status:      comp.status,
      visibility:  comp.visibility,
      invite_code: comp.inviteCode ?? null,
      data:        toDbData(comp),
    })
    .eq('id', comp.id)
    .select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('not_permitted')
}

// Save ONLY what changed between `before` (what this screen started from)
// and `after`, merged onto the CURRENT database row by the patch_competition
// RPC (13_patch_competition.sql). A stale copy can therefore never overwrite
// fields it did not change (e.g. unlock results locked from another device).
// Falls back to a full update if the RPC is not installed yet.
const CLIENT_ONLY_KEYS = new Set(['_hasJoinPassword', 'hasJoinPassword'])

export function diffCompetition(before: Competition, after: Competition): { set: Record<string, unknown>; unset: string[] } {
  const b = before as unknown as Record<string, unknown>
  const a = after  as unknown as Record<string, unknown>
  const set: Record<string, unknown> = {}
  const unset: string[] = []
  for (const key of new Set([...Object.keys(b), ...Object.keys(a)])) {
    if (CLIENT_ONLY_KEYS.has(key) || key === 'id' || key === 'ownerId') continue
    const av = a[key], bv = b[key]
    if (av === undefined) { if (bv !== undefined) unset.push(key); continue }
    if (JSON.stringify(av) !== JSON.stringify(bv)) set[key] = av
  }
  return { set, unset }
}

export async function saveCompetitionChanges(before: Competition, after: Competition): Promise<Competition | null> {
  const { set, unset } = diffCompetition(before, after)
  if (Object.keys(set).length === 0 && unset.length === 0) return null   // nothing to save
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('patch_competition', {
    p_competition_id: after.id, p_set: set, p_unset: unset,
  })
  if (error) {
    // RPC not deployed yet → previous behaviour (full update)
    if (error.code === 'PGRST202' || error.code === '42883') {
      await updateCompetition(after)
      return null
    }
    throw error
  }
  return data as Competition
}

export async function deleteCompetition(compId: string): Promise<void> {
  const { error } = await supabase.from('competitions').delete().eq('id', compId)
  if (error) throw error
}

// Server-side lookup (get_competition_by_invite RPC) so it also works for
// PRIVATE competitions the user is not a member of yet. The password and the
// ban list are stripped; `hasJoinPassword` tells the UI to ask for it.
// Throws on network/server errors so the UI can tell "not found" apart from
// "could not check".
export async function fetchCompetitionByInviteCode(code: string): Promise<Competition | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('get_competition_by_invite', { p_code: code.trim().toUpperCase() })
  if (error) throw error
  return (data ?? null) as Competition | null
}

// ─── JOIN (server-side) ───────────────────────────────────────────────────────
// join_competition RPC: password, bans, capacity and bib numbers are all
// enforced in the database, inside one transaction.

export type JoinStatus = 'joined' | 'already' | 'waitlisted' | 'full' | 'banned' | 'bad_password' | 'not_found'

export async function joinCompetitionRpc(
  competitionId: string,
  opts: { password?: string; traitIds?: string[]; gender?: string; waitlist?: boolean } = {},
): Promise<{ status: JoinStatus; bib?: number }> {
  return withRetry(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('join_competition', {
      p_competition_id: competitionId,
      p_password:       opts.password ?? null,
      p_trait_ids:      opts.traitIds ?? null,
      p_gender:         opts.gender || null,
      p_waitlist:       opts.waitlist ?? false,
    })
    if (error) throw error
    return data as { status: JoinStatus; bib?: number }
  })
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
  const rows = await fetchAllPages<{ competition_id: string; data: unknown }>((from, to) =>
    supabase
      .from('boulders')
      .select('competition_id, data, position')
      .in('competition_id', ids)
      .order('position', { ascending: true })
      .order('id',       { ascending: true })
      .range(from, to)
  )
  const result: Record<string, Boulder[]> = Object.fromEntries(ids.map(id => [id, []]))
  for (const row of rows) result[row.competition_id]?.push(row.data as unknown as Boulder)
  return result
}

// Upsert in place. NEVER delete-and-reinsert everything: completions.boulder_id
// references boulders(id) ON DELETE CASCADE, so that would wipe every user's
// completions whenever any boulder attribute is edited.
export async function upsertBoulders(competitionId: string, boulders: Boulder[]): Promise<void> {
  if (boulders.length > 0) {
    const { error } = await supabase.from('boulders').upsert(
      boulders.map((b, idx) => ({
        id:             b.id,
        competition_id: competitionId,
        position:       idx,
        data:           b as unknown as Json,
      })),
      { onConflict: 'id' },
    )
    if (error) throw error
  }

  // Boulders are NEVER hard-deleted here. Deleting is a soft delete
  // (status 'removed') done by the UI. Hard-deleting "whatever is not in my
  // local list" wiped boulders created by another organizer (or missing from
  // a stale tab) together with all their scores (ON DELETE CASCADE).
}

// ─── COMPLETIONS ──────────────────────────────────────────────────────────────

// Paginated: 300 competitors × 30 boulders = 9 000 rows, far above the
// default 1 000-row response cap. Ordered by the primary key so pages are stable.
export async function fetchCompletions(competitionId: string): Promise<Completion[]> {
  const rows = await fetchAllPages<{ data: unknown }>((from, to) =>
    supabase
      .from('completions')
      .select('data')
      .eq('competition_id', competitionId)
      .order('competitor_id', { ascending: true })
      .order('boulder_id',    { ascending: true })
      .range(from, to)
  )
  return rows.map(r => r.data as unknown as Completion)
}

// Fetch completions for multiple competitions (paginated).
export async function fetchAllCompletionsForComps(ids: string[]): Promise<Record<string, Completion[]>> {
  if (ids.length === 0) return {}
  const rows = await fetchAllPages<{ competition_id: string; data: unknown }>((from, to) =>
    supabase
      .from('completions')
      .select('competition_id, data')
      .in('competition_id', ids)
      .order('competition_id', { ascending: true })
      .order('competitor_id',  { ascending: true })
      .order('boulder_id',     { ascending: true })
      .range(from, to)
  )
  const result: Record<string, Completion[]> = Object.fromEntries(ids.map(id => [id, []]))
  for (const row of rows) result[row.competition_id]?.push(row.data as unknown as Completion)
  return result
}

// Wrapped with retry so a transient network blip doesn't silently lose a score.
export async function upsertCompletion(competitionId: string, completion: Completion, cancel?: AbortSignal): Promise<void> {
  await withRetry(async () => {
    await supabase
      .from('completions')
      .upsert({
        competition_id: competitionId,
        competitor_id:  completion.competitorId,
        boulder_id:     completion.boulderId,
        data:           completion as unknown as Json,
      })
      .abortSignal(anySignal([timeoutSignal(SCORE_WRITE_TIMEOUT), cancel]))
      .throwOnError()
  }, SCORE_WRITE_ATTEMPTS, undefined, undefined, cancel)
}

export async function deleteCompletion(
  competitionId: string, competitorId: string, boulderId: string, cancel?: AbortSignal,
): Promise<void> {
  await withRetry(async () => {
    const { data } = await supabase
      .from('completions')
      .delete()
      .match({ competition_id: competitionId, competitor_id: competitorId, boulder_id: boulderId })
      .select('boulder_id')
      .abortSignal(anySignal([timeoutSignal(SCORE_WRITE_TIMEOUT), cancel]))
      .throwOnError()
    if (data && data.length > 0) return
    // Nothing deleted: either it never existed (fine) or the access rules
    // silently refused it. A refused delete must not look like a success.
    const { data: still } = await supabase
      .from('completions')
      .select('boulder_id')
      .match({ competition_id: competitionId, competitor_id: competitorId, boulder_id: boulderId })
      .abortSignal(anySignal([timeoutSignal(SCORE_WRITE_TIMEOUT), cancel]))
      .throwOnError()
    if (still && still.length > 0) throw Object.assign(new Error('delete not permitted'), { code: '42501' })
  }, SCORE_WRITE_ATTEMPTS, undefined, undefined, cancel)
}

// ─── COMPETITION MEMBERS ──────────────────────────────────────────────────────

// Single-competition fetch (used by real-time INSERT handler, join flow, etc.)
async function fetchMembersByStatus(competitionId: string, status: string): Promise<Competitor[]> {
  const rows = await fetchAllPages<MemberRow>((from, to) =>
    supabase
      .from('competition_members')
      .select('competition_id, user_id, role, status, bib_number, trait_ids, gender')
      .eq('competition_id', competitionId)
      .eq('status', status)
      .order('joined_at', { ascending: true })
      .order('user_id',   { ascending: true })
      .range(from, to)
  )
  if (rows.length === 0) return []
  const [profileMap, emails] = await Promise.all([
    fetchProfiles([...new Set(rows.map(r => r.user_id))]),
    fetchMemberEmails([competitionId]),
  ])
  return rows.map(row => memberRowToCompetitor(
    { ...row, profiles: profileMap[row.user_id] ?? null },
    emails[`${row.competition_id}:${row.user_id}`] ?? '',
  ))
}

// One member, built from a realtime INSERT row (fetches only that profile).
export async function fetchMemberFromRow(row: MemberRow): Promise<Competitor> {
  const [profileMap, emails] = await Promise.all([
    fetchProfiles([row.user_id]),
    fetchMemberEmails([row.competition_id]),
  ])
  return memberRowToCompetitor(
    { ...row, trait_ids: row.trait_ids ?? [], profiles: profileMap[row.user_id] ?? null },
    emails[`${row.competition_id}:${row.user_id}`] ?? '',
  )
}

export type MemberRow = {
  competition_id: string; user_id: string; role: string; status: string
  bib_number: number | null; trait_ids: string[]; gender: string | null
}

// Multi-competition fetch. Returns a map keyed by competition ID.
async function fetchAllMembersByStatus(ids: string[], status: string): Promise<Record<string, Competitor[]>> {
  if (ids.length === 0) return {}
  const rows = await fetchAllPages<MemberRow>((from, to) =>
    supabase
      .from('competition_members')
      .select('competition_id, user_id, role, status, bib_number, trait_ids, gender')
      .in('competition_id', ids)
      .eq('status', status)
      .order('joined_at', { ascending: true })
      .order('user_id',   { ascending: true })
      .range(from, to)
  )

  const result: Record<string, Competitor[]> = Object.fromEntries(ids.map(id => [id, []]))
  if (rows.length === 0) return result

  const [profileMap, emails] = await Promise.all([
    fetchProfiles([...new Set(rows.map(r => r.user_id))]),
    fetchMemberEmails(ids),
  ])
  for (const row of rows) {
    result[row.competition_id]?.push(memberRowToCompetitor(
      { ...row, profiles: profileMap[row.user_id] ?? null },
      emails[`${row.competition_id}:${row.user_id}`] ?? '',
    ))
  }
  return result
}

export async function fetchMembers(competitionId: string): Promise<Competitor[]> {
  return fetchMembersByStatus(competitionId, 'active')
}

export async function fetchWaitlist(competitionId: string): Promise<Competitor[]> {
  return fetchMembersByStatus(competitionId, 'waitlisted')
}

// Insert a member row as owner/organizer (create / clone competition).
// Competitors never call this: they join through joinCompetitionRpc().
export async function upsertMember(
  competitionId: string,
  userId: string,
  fields: { role?: string; status?: string; bib_number?: number | null; trait_ids?: string[]; gender?: string | null }
): Promise<void> {
  const { error } = await supabase.from('competition_members').upsert({
    competition_id: competitionId,
    user_id:        userId,
    ...fields,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
  if (error) throw error
}

// Update ONLY the given fields of an existing member row (role, bib,
// categories, gender...). Never touches other columns, so changing a bib no
// longer wipes the competitor's categories. Throws if no row was changed
// (no permission / member not found) so the UI can report it.
export async function updateMember(
  competitionId: string,
  userId: string,
  fields: { role?: string; status?: string; bib_number?: number | null; trait_ids?: string[]; gender?: string | null }
): Promise<void> {
  const clean = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined))
  if (Object.keys(clean).length === 0) return
  const { data, error } = await supabase
    .from('competition_members')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(clean as any)
    .match({ competition_id: competitionId, user_id: userId })
    .select('user_id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('not_permitted')
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
  const rawComps = await fetchUserCompetitions(userId)

  if (rawComps.length === 0) {
    return { comps: [], boulders: {}, completions: {}, members: {}, waitlists: {}, activeId: '' }
  }

  const ids      = rawComps.map(c => c.id)
  const activeId = (preferredActiveId && ids.includes(preferredActiveId))
    ? preferredActiveId
    : ids[0]

  const [boulders, members, waitlists, activeCompletions] = await Promise.all([
    fetchAllBouldersForComps(ids),
    fetchAllMembersByStatus(ids, 'active'),
    fetchAllMembersByStatus(ids, 'waitlisted'),
    fetchCompletions(activeId),
  ])

  // Strip the join password and the ban list for users who do not manage the
  // competition (not owner, not organizer). Owners and co-organizers keep them:
  // they save the whole competition object, and a stripped copy would erase
  // the password and the bans from the database on their next save.
  // `hasJoinPassword` tells the UI to ask for the password.
  const comps: Competition[] = rawComps.map(comp => {
    const isManager = comp.ownerId === userId
      || (members[comp.id] ?? []).some(m => m.id === userId && m.role === 'organizer')
    const c = comp as Competition & { bannedEmails?: string[] }
    const hasJoinPassword = !!c.joinPassword
    if (isManager) return { ...c, hasJoinPassword }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { joinPassword: _jp, bannedEmails: _be, ...safe } = c
    return { ...safe, hasJoinPassword } as Competition
  })

  const completions: Record<string, Completion[]> = Object.fromEntries(ids.map(id => [id, []]))
  completions[activeId] = activeCompletions

  return { comps, boulders, completions, members, waitlists, activeId }
}

// ─── PUBLIC LEADERBOARD ───────────────────────────────────────────────────────

// Anonymous, read-only snapshot for shared result links. Backed by the
// get_public_leaderboard SECURITY DEFINER RPC (supabase/05_public_leaderboard.sql).
export interface PublicLeaderboardData {
  competition: Competition
  boulders:    Boulder[]
  completions: Completion[]
  competitors: Competitor[]
}

export async function fetchPublicLeaderboard(competitionId: string): Promise<PublicLeaderboardData | null> {
  // 15 s cap: a hung request must not freeze the venue screen's refresh loop.
  const { data, error } = await (supabase as any)
    .rpc('get_public_leaderboard', { p_competition_id: competitionId })
    .abortSignal(timeoutSignal(15_000))
  if (error) throw error
  if (!data) return null
  const d = data as any
  return {
    competition: d.competition as Competition,
    boulders:    (d.boulders    ?? []) as Boulder[],
    completions: (d.completions ?? []) as Completion[],
    competitors: (d.competitors ?? []).map((r: any) => memberRowToCompetitor({
      ...r,
      profiles: { display_name: r.display_name, avatar_url: r.avatar_url, emoji: r.emoji },
    })),
  }
}
