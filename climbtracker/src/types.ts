// ─── CONSTANTS (replacing enums) ─────────────────────────────────────────────

export const ScoringType = {
  TRADITIONAL: 'TRADITIONAL',
  DYNAMIC:     'DYNAMIC',
} as const

export type ScoringType = typeof ScoringType[keyof typeof ScoringType]

export const CompetitionStatus = {
  DRAFT:    'DRAFT',
  LIVE:     'LIVE',
  FINISHED: 'FINISHED',
  ARCHIVED: 'ARCHIVED',
} as const

export type CompetitionStatus = typeof CompetitionStatus[keyof typeof CompetitionStatus]

// ─── SMALL BUILDING BLOCKS ────────────────────────────────────────────────────

export interface Category {
  id:   string
  name: string
}

// ─── ZONE SCORING ─────────────────────────────────────────────────────────────

export const ZoneScoring = {
  ADDS_TO_SCORE:    'adds_to_score',
  TIE_BREAKER_ONLY: 'tie_breaker_only',
} as const

export type ZoneScoring = typeof ZoneScoring[keyof typeof ZoneScoring]

export interface DifficultyLevel {
  id:         string
  level:      number
  label:      string
  basePoints: number
  zonePoints: number
}

// ─── BOULDER ──────────────────────────────────────────────────────────────────

export interface Boulder {
  id:           string
  number:       number
  name?:        string
  color:        string
  difficultyId?: string
  isPuntuable?: boolean
  maxPoints?:   number
  style?:       string
  status:       'active' | 'hidden' | 'removed'
  zoneCount:    number
  tags:         string[]
}

// ─── COMPETITOR ───────────────────────────────────────────────────────────────

export interface Competitor {
  id:          string
  firstName:   string
  lastName:    string
  displayName: string
  email:       string
  gender:      string
  categoryId:  string
  bibNumber:   number
  avatar?:     string
  role?:       'competitor' | 'judge' | 'organizer'
}

// ─── COMPLETION ───────────────────────────────────────────────────────────────

export interface Completion {
  competitorId:      string
  boulderId:         string
  attempts:          number
  timestamp:         number
  hasZone:           boolean
  zoneAttempts:      number
  zonesReached:      number
  zoneTimestamp?:    number
  zoneValidatedBy?:  string
  topValidated:      boolean
  topValidatedBy?:   string
  topValidatedAt?:   number
}

// ─── RULES ────────────────────────────────────────────────────────────────────

export interface RuleSet {
  en: string
  es: string
  ca: string
}

// ─── SCORING METHOD ───────────────────────────────────────────────────────────

export const ScoringMethod = {
  SELF_SCORING:          'self_scoring',
  SELF_WITH_APPROVAL:    'self_with_approval',
  JUDGE_REQUIRED:        'judge_required',
} as const

export type ScoringMethod = typeof ScoringMethod[keyof typeof ScoringMethod]

// ─── COMPETITION ──────────────────────────────────────────────────────────────

export interface Competition {
  id:                 string
  ownerId:            string
  name:               string
  description:        string
  location:           string
  startDate:          string
  endDate:            string
  status:             CompetitionStatus
  scoringType:        ScoringType
  categories:         Category[]
  difficultyLevels:   DifficultyLevel[]
  topKBoulders?:      number
  dynamicPot?:        number
  minDynamicPoints?:  number
  isLocked:           boolean
  canSelfScore:       boolean
  rules:              RuleSet
  inviteCode:         string
  penalizeAttempts:   boolean
  penaltyType:        'fixed' | 'percent'
  penaltyValue:       number
  minScorePerBoulder: number
  zoneScoring:        ZoneScoring
  scoringMethod:      ScoringMethod
}

// ─── LEADERBOARD ROW ──────────────────────────────────────────────────────────

export interface RankResult {
  competitorId:  string
  name:          string
  bib:           number
  category:      string
  gender:        string       // ← added: used in LeaderboardPage filters
  totalPoints:   number
  totalTops:     number
  totalAttempts: number
  rank:          number
  flashCount:    number
  totalZones:    number
  zoneAttempts:  number
}