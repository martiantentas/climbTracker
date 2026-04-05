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

export interface DifficultyLevel {
  id:         string
  level:      number   // 1 to 9
  basePoints: number
}

// ─── BOULDER ──────────────────────────────────────────────────────────────────

export interface Boulder {
  id:           string
  number:       number
  name?:        string        // optional — the ? means it can be missing
  color:        string
  difficultyId?: string       // which DifficultyLevel this boulder uses
  isPuntuable?: boolean       // true = requires a referee to validate
  maxPoints?:   number        // override for Dynamic scoring
  style?:       string        // e.g. "Slab", "Overhang", "Dyno"
  status:       'active' | 'hidden' | 'removed'
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
  avatar?:     string        // optional profile picture URL
  role?:       'competitor' | 'judge'
}

// ─── COMPLETION ───────────────────────────────────────────────────────────────

export interface Completion {
  competitorId: string
  boulderId:    string
  attempts:     number
  timestamp:    number       // Unix timestamp — Date.now()
  isPuntuable?: boolean
}

// ─── RULES ────────────────────────────────────────────────────────────────────

export interface RuleSet {
  en: string   // English
  es: string   // Spanish
  ca: string   // Catalan
}

// ─── COMPETITION ──────────────────────────────────────────────────────────────

export interface Competition {
  id:                 string
  ownerId:            string            // who created and manages this comp
  name:               string
  description:        string
  location:           string
  startDate:          string
  endDate:            string
  status:             CompetitionStatus
  scoringType:        ScoringType
  categories:         Category[]
  difficultyLevels:   DifficultyLevel[]
  topKBoulders?:      number            // only count best N boulders per competitor
  dynamicPot?:        number            // total points shared in Dynamic mode
  minDynamicPoints?:  number            // floor — nobody gets less than this
  isLocked:           boolean           // when true, scores can't be edited
  canSelfScore:       boolean           // competitors log their own tops
  rules:              RuleSet
  inviteCode:         string            // short code to join the comp
  penalizeAttempts:   boolean
  penaltyType:        'fixed' | 'percent'
  penaltyValue:       number
  minScorePerBoulder: number
}

// ─── LEADERBOARD ROW ──────────────────────────────────────────────────────────

export interface RankResult {
  competitorId:  string
  name:          string
  bib:           number
  category:      string
  totalPoints:   number
  totalTops:     number
  totalAttempts: number
  rank:          number
  flashCount:    number
}