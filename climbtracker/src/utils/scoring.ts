import type { Competition, Boulder, Competitor, Completion, RankResult } from '../types'
import { ScoringType } from '../types'

// ─── TRADITIONAL SCORING ──────────────────────────────────────────────────────

function calcTraditionalPoints(
  completion: Completion,
  boulder:    Boulder,
  comp:       Competition,
): number {
  const difficulty = comp.difficultyLevels.find(d => d.id === boulder.difficultyId)
  if (!difficulty) return 0

  let points = 0

  // Zone points — awarded even without a top if zoneScoring adds to score
  if (comp.zoneScoring === 'adds_to_score' && completion.zonesReached > 0) {
    const totalZones = boulder.zoneCount || 1
    // Points are proportional to how many zones were reached
    const zonePointsEarned = Math.floor(
      difficulty.zonePoints * (completion.zonesReached / totalZones)
    )
    points += zonePointsEarned
  }

  // Top points — only if top was validated
  if (completion.topValidated) {
    let topPoints = difficulty.basePoints

    if (comp.penalizeAttempts && completion.attempts > 1) {
      const extra = completion.attempts - 1
      if (comp.penaltyType === 'fixed') {
        topPoints -= extra * comp.penaltyValue
      } else {
        topPoints -= extra * (difficulty.basePoints * comp.penaltyValue / 100)
      }
    }

    points += Math.max(topPoints, comp.minScorePerBoulder)
  }

  return Math.max(points, 0)
}

  // Only count validated tops
  if (!completion.topValidated) {
    // If zone scoring adds to score, count zone points even without top
    if (comp.zoneScoring === 'adds_to_score' && completion.hasZone) {
      return Math.max(difficulty.zonePoints, comp.minScorePerBoulder)
    }
    return 0
  }

  let points = difficulty.basePoints

  // Add zone points if zone scoring is additive
  if (comp.zoneScoring === 'adds_to_score' && completion.hasZone) {
    points += difficulty.zonePoints
  }

  if (comp.penalizeAttempts && completion.attempts > 1) {
    const extraAttempts = completion.attempts - 1
    if (comp.penaltyType === 'fixed') {
      points -= extraAttempts * comp.penaltyValue
    } else {
      points -= extraAttempts * (difficulty.basePoints * comp.penaltyValue / 100)
    }
  }

  // Never go below the minimum score per boulder
  return Math.max(points, comp.minScorePerBoulder)
}

// ─── DYNAMIC SCORING ──────────────────────────────────────────────────────────

export function calculateRankings(
  competition:  Competition,
  boulders:     Boulder[],
  competitors:  Competitor[],
  completions:  Completion[],
): RankResult[] {
  const actualCompetitors = competitors.filter(c =>
    c.id !== competition.ownerId && c.role !== 'judge'
  )

  const results = actualCompetitors.map(competitor => {
    // Include ALL completions — not just topped ones
    // Zone-only completions still contribute points
    const mine = completions.filter(c => c.competitorId === competitor.id)

    const totalPoints   = calcCompetitorScore(competitor, competition, boulders, completions)
    const totalTops     = mine.filter(c => c.topValidated).length
    const totalAttempts = mine.reduce((sum, c) => sum + c.attempts, 0)
    const flashCount    = mine.filter(c => c.attempts === 1 && c.topValidated).length
    const totalZones    = mine.reduce((sum, c) => sum + (c.zonesReached ?? 0), 0)
    const zoneAttempts  = mine.reduce((sum, c) => sum + c.zoneAttempts, 0)

    const category = competition.categories.find(cat => cat.id === competitor.categoryId)

    return {
      competitorId:  competitor.id,
      name:          competitor.displayName,
      bib:           competitor.bibNumber,
      category:      category?.name ?? 'Unknown',
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

  results.sort((a, b) => {
    if (b.totalPoints   !== a.totalPoints)   return b.totalPoints   - a.totalPoints
    if (b.totalTops     !== a.totalTops)     return b.totalTops     - a.totalTops
    if (a.totalAttempts !== b.totalAttempts) return a.totalAttempts - b.totalAttempts
    if (b.totalZones    !== a.totalZones)    return b.totalZones    - a.totalZones
    if (a.zoneAttempts  !== b.zoneAttempts)  return a.zoneAttempts  - b.zoneAttempts
    return b.flashCount - a.flashCount
  })

  results.forEach((result, index) => {
    if (index === 0) {
      result.rank = 1
    } else {
      const prev = results[index - 1]
      const sameScore =
        result.totalPoints   === prev.totalPoints &&
        result.totalAttempts === prev.totalAttempts &&
        result.totalZones    === prev.totalZones &&
        result.flashCount    === prev.flashCount
      result.rank = sameScore ? prev.rank : index + 1
    }
  })

  return results
}

// ─── TOTAL SCORE FOR ONE COMPETITOR ───────────────────────────────────────────

function calcCompetitorScore(
  competitor:  Competitor,
  competition: Competition,
  boulders:    Boulder[],
  completions: Completion[],  // all completions in the competition
): number {
  // Only look at this competitor's completions
  const mine = completions.filter(c => c.competitorId === competitor.id)

  // Calculate points for each of their topped boulders
  const scores = mine.map(completion => {
    const boulder = boulders.find(b => b.id === completion.boulderId)
    if (!boulder) return 0

    if (competition.scoringType === ScoringType.DYNAMIC) {
      return calcDynamicPoints(boulder, completions, competition)
    } else {
      return calcTraditionalPoints(completion, boulder, competition)
    }
  })

  // Sort descending so we can take the best K
  scores.sort((a, b) => b - a)

  // If topKBoulders is set, only count the best K scores
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
  // Exclude the organizer and any judges — they don't compete
  const actualCompetitors = competitors.filter(c =>
    c.id !== competition.ownerId && c.role !== 'judge'
  )

  const results = actualCompetitors.map(competitor => {
  const mine = completions.filter(c => c.competitorId === competitor.id)

  const totalPoints   = calcCompetitorScore(competitor, competition, boulders, completions)
  const totalTops     = mine.filter(c => c.topValidated).length
  const totalAttempts = mine.reduce((sum, c) => sum + c.attempts, 0)
  const flashCount    = mine.filter(c => c.attempts === 1 && c.topValidated).length
  const totalZones    = mine.filter(c => c.hasZone).length
  const zoneAttempts  = mine.reduce((sum, c) => sum + c.zoneAttempts, 0)

  const category = competition.categories.find(cat => cat.id === competitor.categoryId)

  return {
    competitorId:  competitor.id,
    name:          competitor.displayName,
    bib:           competitor.bibNumber,
    category:      category?.name ?? 'Unknown',
    totalPoints,
    totalTops,
    totalAttempts,
    flashCount,
    totalZones,
    zoneAttempts,
    rank: 0,
  }
})

// Update sort to use zones as tie-breaker
results.sort((a, b) => {
  if (b.totalPoints   !== a.totalPoints)   return b.totalPoints   - a.totalPoints
  if (b.totalTops     !== a.totalTops)     return b.totalTops     - a.totalTops
  if (a.totalAttempts !== b.totalAttempts) return a.totalAttempts - b.totalAttempts
  if (b.totalZones    !== a.totalZones)    return b.totalZones    - a.totalZones
  if (a.zoneAttempts  !== b.zoneAttempts)  return a.zoneAttempts  - b.zoneAttempts
  return b.flashCount - a.flashCount
})

  results.sort((a, b) => {
    if (b.totalPoints   !== a.totalPoints)   return b.totalPoints   - a.totalPoints
    if (a.totalAttempts !== b.totalAttempts) return a.totalAttempts - b.totalAttempts
    return b.flashCount - a.flashCount
  })

  results.forEach((result, index) => {
    if (index === 0) {
      result.rank = 1
    } else {
      const prev = results[index - 1]
      const sameScore =
        result.totalPoints   === prev.totalPoints &&
        result.totalAttempts === prev.totalAttempts &&
        result.flashCount    === prev.flashCount
      result.rank = sameScore ? prev.rank : index + 1
    }
  })

  return results
}