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

// ─── DYNAMIC SCORING ──────────────────────────────────────────────────────────

function calcDynamicPoints(
  boulder:     Boulder,
  completions: Completion[],
  comp:        Competition,
): number {
  const topsCount = completions.filter(
    c => c.boulderId === boulder.id && c.topValidated
  ).length

  if (topsCount === 0) return boulder.maxPoints ?? comp.dynamicPot ?? 1000

  const pot = boulder.maxPoints ?? comp.dynamicPot ?? 1000
  return Math.max(
    Math.floor(pot / topsCount),
    comp.minDynamicPoints ?? 0
  )
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

    if (competition.scoringType === ScoringType.DYNAMIC) {
      return calcDynamicPoints(boulder, completions, competition)
    } else {
      return calcTraditionalPoints(completion, boulder, competition)
    }
  })

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
  const actualCompetitors = competitors.filter(c =>
    c.id !== competition.ownerId && c.role !== 'judge'
  )

  const results = actualCompetitors.map(competitor => {
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
        result.totalTops     === prev.totalTops   &&
        result.totalAttempts === prev.totalAttempts &&
        result.totalZones    === prev.totalZones  &&
        result.zoneAttempts  === prev.zoneAttempts &&
        result.flashCount    === prev.flashCount
      result.rank = sameScore ? prev.rank : index + 1
    }
  })

  return results
}