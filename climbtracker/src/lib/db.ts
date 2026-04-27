import { supabase } from './supabase'
import type { Json } from './database.types'
import type { Competition, Boulder, Completion, Competitor } from '../types'

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
  // Competitions the user owns
  const { data: owned, error: e1 } = await supabase
    .from('competitions')
    .select('data')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
  if (e1) throw e1

  // Competition IDs where the user is an active member (not owner)
  const { data: memberships, error: e2 } = await supabase
    .from('competition_members')
    .select('competition_id')
    .eq('user_id', userId)
    .eq('status', 'active')
  if (e2) throw e2

  const memberIds = (memberships ?? []).map(m => m.competition_id)

  let memberComps: Competition[] = []
  if (memberIds.length > 0) {
    const { data, error: e3 } = await supabase
      .from('competitions')
      .select('data')
      .in('id', memberIds)
      .neq('owner_id', userId)          // avoid duplicates with owned
      .order('created_at', { ascending: false })
    if (e3) throw e3
    memberComps = (data ?? []).map(r => r.data as unknown as Competition)
  }

  return [
    ...(owned ?? []).map(r => r.data as unknown as Competition),
    ...memberComps,
  ]
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

export async function upsertBoulders(competitionId: string, boulders: Boulder[]): Promise<void> {
  // Delete all then re-insert so that deletions and reorders are handled cleanly
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

export async function upsertCompletion(competitionId: string, completion: Completion): Promise<void> {
  const { error } = await supabase
    .from('completions')
    .upsert({
      competition_id: competitionId,
      competitor_id:  completion.competitorId,
      boulder_id:     completion.boulderId,
      data:           completion as unknown as Json,
    })
  if (error) throw error
}

export async function deleteCompletion(
  competitionId: string, competitorId: string, boulderId: string
): Promise<void> {
  const { error } = await supabase
    .from('completions')
    .delete()
    .match({ competition_id: competitionId, competitor_id: competitorId, boulder_id: boulderId })
  if (error) throw error
}

// ─── COMPETITION MEMBERS ──────────────────────────────────────────────────────

async function fetchMembersByStatus(competitionId: string, status: string): Promise<Competitor[]> {
  // Step 1: fetch the membership rows
  const { data: rows, error: e1 } = await supabase
    .from('competition_members')
    .select('user_id, role, status, bib_number, trait_ids, gender')
    .eq('competition_id', competitionId)
    .eq('status', status)
  if (e1) throw e1
  if (!rows || rows.length === 0) return []

  // Step 2: fetch profiles for those user IDs (separate query — no direct FK join)
  const userIds = rows.map(r => r.user_id)
  const { data: profiles, error: e2 } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url, emoji')
    .in('id', userIds)
  if (e2) throw e2

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  return rows.map(row => memberRowToCompetitor({
    ...row,
    profiles: profileMap[row.user_id] ?? null,
  }))
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
    trait_ids:      [],          // non-nullable default; overridden by fields if provided
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

// ─── BULK LOADER ─────────────────────────────────────────────────────────────

export async function loadAllUserData(userId: string): Promise<{
  comps:       Competition[]
  boulders:    Record<string, Boulder[]>
  completions: Record<string, Completion[]>
  members:     Record<string, Competitor[]>
  waitlists:   Record<string, Competitor[]>
}> {
  const comps = await fetchUserCompetitions(userId)
  if (comps.length === 0) {
    return { comps: [], boulders: {}, completions: {}, members: {}, waitlists: {} }
  }

  const ids = comps.map(c => c.id)

  const [bouldersFlat, completionsFlat, membersFlat, waitlistsFlat] = await Promise.all([
    Promise.all(ids.map(id => fetchBoulders(id).then(bs => [id, bs] as const))),
    Promise.all(ids.map(id => fetchCompletions(id).then(cs => [id, cs] as const))),
    Promise.all(ids.map(id => fetchMembers(id).then(ms => [id, ms] as const))),
    Promise.all(ids.map(id => fetchWaitlist(id).then(ws => [id, ws] as const))),
  ])

  return {
    comps,
    boulders:    Object.fromEntries(bouldersFlat),
    completions: Object.fromEntries(completionsFlat),
    members:     Object.fromEntries(membersFlat),
    waitlists:   Object.fromEntries(waitlistsFlat),
  }
}
