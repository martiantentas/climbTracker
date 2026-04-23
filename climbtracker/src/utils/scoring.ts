import type { Competition, Boulder, Competitor, Completion, RankResult } from '../types'
import { ScoringType } from '../types'

// ─── TRADITIONAL SCORING ──────────────────────────────────────────────────────
// Zone points behaviour depends on zoneScoring setting:
//   adds_to_score  — zone pts always added regardless of top
//   with_top       — zone pts only if the boulder was also topped
//   without_top    — zone pts only if the boulder was NOT topped (consolation)
//   tie_breaker_only (legacy) — zones never add points

function calcTraditionalPoints(
  completion: Completion,
  boulder:    Boulder,
  comp:       Competition,
): number {
  const difficulty = comp.difficultyLevels.find(d => d.id === boulder.difficultyId)
  if (!difficulty) return 0

  let points = 0

  // Zone points — see zoneScoring rules above
  const zonesReached = completion.zonesReached ?? 0
  if (zonesReached > 0) {
    const zs = comp.zoneScoring
    const awardZone =
      zs === 'adds_to_score'  ||
      (zs === 'with_top'    && completion.topValidated)  ||
      (zs === 'without_top' && !completion.topValidated)
    if (awardZone) {
      points += difficulty.zonePoints * zonesReached
    }
  }
  // tie_breaker_only (legacy): zones contribute 0 pts

  // Top points — only when the top has been validated
  if (completion.topValidated) {
    let topPoints = difficulty.basePoints

    if (comp.penalizeAttempts && completion.attempts > 1) {
      if (comp.penaltyType === 'fixed') {
        topPoints -= (completion.attempts - 1) * comp.penaltyValue
      } else {
        // Compound decay: each extra attempt reduces by penaltyValue% of the running total
        topPoints = difficulty.basePoints * Math.pow(1 - comp.penaltyValue / 100, completion.attempts - 1)
      }
    }

    points += Math.max(topPoints, comp.minScorePerBoulder)
  }

  return Math.max(points, 0)
}

// ─── DYNAMIC SCORING ──────────────────────────────────────────────────────────
// Points for a TOPPED boulder = pot / number of toppers (floor, min = minDynamicPoints).
// A competitor only earns dynamic points if they actually topped the boulder.
// Zone-only attempts don't count toward the pot or earn any points in dynamic mode.

function calcDynamicPointsForBoulder(
  boulder:     Boulder,
  allCompletions: Completion[],
  comp:        Competition,
): number {
  const topsCount = allCompletions.filter(
    c => c.boulderId === boulder.id && c.topValidated
  ).length

  if (topsCount === 0) return boulder.maxPoints ?? comp.dynamicPot ?? 1000

  const pot = boulder.maxPoints ?? comp.dynamicPot ?? 1000
  return Math.max(Math.floor(pot / topsCount), comp.minDynamicPoints ?? 0)
}

// ─── PER-BOULDER SCORE FOR ONE COMPETITOR ─────────────────────────────────────
// Returns the actual points this competitor earned on one boulder.
//
// Traditional: top points (if topped) + zone points (if zoneScoring=adds_to_score)
// Dynamic:     pot/toppers (if topped) + zone points (if zoneScoring=adds_to_score)
//
// Zone points use the difficulty's zonePoints field, prorated by zones reached.
// A zone-only completion in dynamic mode earns zone points only (no top share).

function calcZonePoints(
  completion:  Completion,
  boulder:     Boulder,
  competition: Competition,
): number {
  const zonesReached = completion.zonesReached ?? 0
  if (zonesReached === 0) return 0

  const zs = competition.zoneScoring
  const award =
    zs === 'adds_to_score'  ||
    (zs === 'with_top'    && completion.topValidated)  ||
    (zs === 'without_top' && !completion.topValidated)
  if (!award) return 0

  const difficulty = competition.difficultyLevels.find(d => d.id === boulder.difficultyId)
  if (!difficulty) return 0
  return difficulty.zonePoints * zonesReached
}

export function calcBoulderPoints(
  completion:     Completion,
  boulder:        Boulder,
  competition:    Competition,
  allCompletions: Completion[],
): number {
  const zonePoints = calcZonePoints(completion, boulder, competition)

  if (competition.scoringType === ScoringType.DYNAMIC) {
    if (!completion.topValidated) return zonePoints

    // Base share of the dynamic pot for this boulder
    let topPoints = calcDynamicPointsForBoulder(boulder, allCompletions, competition)

    // Apply attempt penalty to the competitor's personal share if configured
    if (competition.penalizeAttempts && completion.attempts > 1) {
      if (competition.penaltyType === 'fixed') {
        topPoints -= (completion.attempts - 1) * competition.penaltyValue
      } else {
        // Compound decay: each extra attempt reduces by penaltyValue% of the running total
        topPoints = topPoints * Math.pow(1 - competition.penaltyValue / 100, completion.attempts - 1)
      }
      topPoints = Math.max(topPoints, competition.minDynamicPoints ?? 0)
    }

    return Math.max(topPoints + zonePoints, 0)
  }

  // Traditional: zones + top + penalties all handled together
  return calcTraditionalPoints(completion, boulder, competition)
}

// ─── TOTAL SCORE FOR ONE COMPETITOR ───────────────────────────────────────────

function calcCompetitorScore(
  competitor:  Competitor,
  competition: Competition,
  boulders:    Boulder[],
  completions: Completion[],
): number {
  const mine = completions.filter(c => c.competitorId === competitor.id)

  const scores = mine.map(completion => {
    const boulder = boulders.find(b => b.id === completion.boulderId)
    if (!boulder) return 0
    return calcBoulderPoints(completion, boulder, competition, completions)
  })

  // Sort descending and apply topK cap if set
  scores.sort((a, b) => b - a)
  const counted = competition.topKBoulders
    ? scores.slice(0, competition.topKBoulders)
    : scores

  return counted.reduce((sum, s) => sum + s, 0)
}

// ─── FULL RANKINGS ────────────────────────────────────────────────────────────

export function calculateRankings(
  competition:  Competition,
  boulders:     Boulder[],
  competitors:  Competitor[],
  completions:  Completion[],
): RankResult[] {
  const actualCompetitors = competitors
    .filter(c => c.id !== competition.ownerId && c.role !== 'judge' && c.role !== 'organizer')
    // Deduplicate: keep only the first entry per id (most up-to-date after trait edits)
    .filter((c, idx, arr) => arr.findIndex(x => x.id === c.id) === idx)

  const results = actualCompetitors.map(competitor => {
    const mine = completions.filter(c => c.competitorId === competitor.id)

    const totalPoints   = calcCompetitorScore(competitor, competition, boulders, completions)
    const totalTops     = mine.filter(c => c.topValidated).length
    const totalAttempts = mine.reduce((sum, c) => sum + c.attempts, 0)
    const flashCount    = mine.filter(c => c.attempts === 1 && c.topValidated).length
    const totalZones    = mine.reduce((sum, c) => sum + (c.zonesReached ?? 0), 0)
    const zoneAttempts  = mine.reduce((sum, c) => sum + c.zoneAttempts, 0)

    return {
      competitorId:  competitor.id,
      name:          competitor.displayName,
      bib:           competitor.bibNumber,
      traitIds:      competitor.traitIds ?? [],
      gender:        competitor.gender,
      totalPoints,
      totalTops,
      totalAttempts,
      flashCount,
      totalZones,
      zoneAttempts,
      rank: 0,
    }
  })

  // Primary sort: points desc → tops desc → attempts asc → zones desc → zone attempts asc → flashes desc
  results.sort((a, b) => {
    if (b.totalPoints   !== a.totalPoints)   return b.totalPoints   - a.totalPoints
    if (b.totalTops     !== a.totalTops)     return b.totalTops     - a.totalTops
    if (a.totalAttempts !== b.totalAttempts) return a.totalAttempts - b.totalAttempts
    if (b.totalZones    !== a.totalZones)    return b.totalZones    - a.totalZones
    if (a.zoneAttempts  !== b.zoneAttempts)  return a.zoneAttempts  - b.zoneAttempts
    return b.flashCount - a.flashCount
  })

  // Assign ranks (tied competitors share a rank)
  results.forEach((result, index) => {
    if (index === 0) {
      result.rank = 1
    } else {
      const prev = results[index - 1]
      const tied =
        result.totalPoints   === prev.totalPoints   &&
        result.totalTops     === prev.totalTops     &&
        result.totalAttempts === prev.totalAttempts &&
        result.totalZones    === prev.totalZones    &&
        result.zoneAttempts  === prev.zoneAttempts  &&
        result.flashCount    === prev.flashCount
      result.rank = tied ? prev.rank : index + 1
    }
  })

  return results
}