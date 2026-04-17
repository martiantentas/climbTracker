// ─── CONSTANTS ────────────────────────────────────────────────────────────────

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

export type AttemptTracking = 'none' | 'count' | 'fixed_options'

export interface Trait {
  id:   string
  name: string
}

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
  id:                       string
  number:                   number
  name?:                    string
  color:                    string
  difficultyId?:            string
  isPuntuable?:             boolean
  maxPoints?:               number
  style?:                   string
  status:                   'active' | 'hidden' | 'removed'
  zoneCount:                number
  tags:                     string[]
  attemptTrackingOverride?: AttemptTracking
}

// ─── COMPETITOR ───────────────────────────────────────────────────────────────

export interface Competitor {
  id:          string
  firstName:   string
  lastName:    string
  displayName: string
  email:       string
  gender?:     string
  traitIds:    string[]   // IDs from competition.traits — multi-select
  bibNumber:   number
  avatar?:     string
  role?:       'competitor' | 'judge' | 'organizer'
}

// ─── COMPLETION ───────────────────────────────────────────────────────────────

export interface Completion {
  competitorId:     string
  boulderId:        string
  attempts:         number
  timestamp:        number
  hasZone:          boolean
  zoneAttempts:     number
  zonesReached:     number
  zoneTimestamp?:   number
  zoneValidatedBy?: string
  topValidated:     boolean
  topValidatedBy?:  string
  topValidatedAt?:  number
}

export interface RuleSet {
  en: string
  es: string
  ca: string
}

export const ScoringMethod = {
  SELF_SCORING:       'self_scoring',
  SELF_WITH_APPROVAL: 'self_with_approval',
  JUDGE_REQUIRED:     'judge_required',
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
  traits:             Trait[]
  requireTraits:      boolean          // if true, competitors must pick traits on join
  difficultyLevels:   DifficultyLevel[]
  topKBoulders?:      number
  dynamicPot?:        number
  minDynamicPoints?:  number
  isLocked:           boolean
  canSelfScore:       boolean
  rules:              RuleSet
  inviteCode:         string
  // Optional — when set, required in addition to the invite code or join link
  joinPassword?:      string

  // Visibility — 'public' shows in the discover list; 'private' is invite-only
  visibility:         'public' | 'private'
  penalizeAttempts:   boolean
  penaltyType:        'fixed' | 'percent'
  penaltyValue:       number
  minScorePerBoulder: number
  zoneScoring:        ZoneScoring
  scoringMethod:      ScoringMethod

  // Subscription — set when organiser pays to publish; gates Draft → Live
  subscription?:      'one_shot' | 'standard' | 'premium' | 'pro' | 'platinum'
  tier?:              'standard' | 'premium'

  // Capacity — set on publish
  participantLimit?:   number
  additionalCapacity?: number

  // Branding — Premium tier only
  branding?: {
    logoDataUrl?:  string   // base64 data URL of a custom logo
    accentColor?:  string   // hex e.g. '#FF5500'
    lightBg?:      string   // hex for light-mode page background
    darkBg?:       string   // hex for dark-mode page background
  }

  attemptTracking:    AttemptTracking
  maxFixedAttempts:   number
}

// ─── LEADERBOARD ROW ──────────────────────────────────────────────────────────

export interface RankResult {
  competitorId:  string
  name:          string
  bib:           number
  traitIds:      string[]
  gender?:       string
  totalPoints:   number
  totalTops:     number
  totalAttempts: number
  rank:          number
  flashCount:    number
  totalZones:    number
  zoneAttempts:  number
}