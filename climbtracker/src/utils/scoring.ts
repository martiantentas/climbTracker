import type { Competition, Boulder, Competitor, Completion, RankResult } from '../types'
import { ScoringType } from '../types'

// ─── TRADITIONAL SCORING ──────────────────────────────────────────────────────

function calcTraditionalPoints(
  completion: Completion,
  boulder:    Boulder,
  comp:       Competition,
): number {
  // Find the difficulty level assigned to this boulder
  const difficulty = comp.difficultyLevels.find(d => d.id === boulder.difficultyId)

  // If the boulder has no difficulty assigned, it's worth 0 points
  if (!difficulty) return 0

  let points = difficulty.basePoints

  // Apply attempt penalty if the competition has it enabled
  if (comp.penalizeAttempts && completion.attempts > 1) {
    const extraAttempts = completion.attempts - 1

    if (comp.penaltyType === 'fixed') {
      // Subtract a flat amount per extra attempt
      points -= extraAttempts * comp.penaltyValue
    } else {
      // Subtract a percentage of base points per extra attempt
      points -= extraAttempts * (difficulty.basePoints * comp.penaltyValue / 100)
    }
  }

  // Never go below the minimum score per boulder
  return Math.max(points, comp.minScorePerBoulder)
}

// ─── DYNAMIC SCORING ──────────────────────────────────────────────────────────

function calcDynamicPoints(
  boulder:     Boulder,
  completions: Completion[],  // all completions across all competitors
  comp:        Competition,
): number {
  // Count how many competitors topped this specific boulder
  const tops = completions.filter(c => c.boulderId === boulder.id).length

  // If nobody topped it, it's worth 0
  if (tops === 0) return 0

  const pot = boulder.maxPoints ?? comp.dynamicPot ?? 1000
  const min = comp.minDynamicPoints ?? 0

  // The pot is shared equally among everyone who topped it
  const shared = Math.floor(pot / tops)

  // Never go below the minimum
  return Math.max(shared, min)
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
    const totalTops     = mine.length
    const totalAttempts = mine.reduce((sum, c) => sum + c.attempts, 0)
    const flashCount    = mine.filter(c => c.attempts === 1).length
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
      rank: 0,
    }
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