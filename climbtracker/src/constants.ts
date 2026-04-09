import type {
  Competition,
  Boulder,
  Competitor,
  Completion,
  Category,
  DifficultyLevel,
} from './types'

import {
  CompetitionStatus,
  ScoringType,
} from './types'

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Open Men' },
  { id: 'cat-2', name: 'Open Women' },
  { id: 'cat-3', name: 'Masters' },
  { id: 'cat-4', name: 'Youth' },
]

// ─── DIFFICULTY LEVELS ────────────────────────────────────────────────────────

export const INITIAL_DIFFICULTIES: DifficultyLevel[] = [
  { id: 'diff-1', level: 1, label: 'Green',  basePoints: 100, zonePoints: 50  },
  { id: 'diff-2', level: 2, label: 'Yellow', basePoints: 200, zonePoints: 100 },
  { id: 'diff-3', level: 3, label: 'Orange', basePoints: 300, zonePoints: 150 },
  { id: 'diff-4', level: 4, label: 'Red',    basePoints: 400, zonePoints: 200 },
  { id: 'diff-5', level: 5, label: 'Blue',   basePoints: 500, zonePoints: 250 },
  { id: 'diff-6', level: 6, label: 'Purple', basePoints: 600, zonePoints: 300 },
  { id: 'diff-7', level: 7, label: 'Black',  basePoints: 700, zonePoints: 350 },
  { id: 'diff-8', level: 8, label: 'White',  basePoints: 800, zonePoints: 400 },
  { id: 'diff-9', level: 9, label: 'Pink',   basePoints: 900, zonePoints: 450 },
]

// ─── MOCK COMPETITION ─────────────────────────────────────────────────────────

export const MOCK_COMPETITION: Competition = {
  id:          'comp-1',
  ownerId:     'u-admin',
  name:        'Summer Sizzler Bouldering 2024',
  description: 'The biggest community boulder comp of the summer.',
  location:    'Vertical Heights Gym, Barcelona',
  startDate:   '2024-07-15T09:00:00Z',
  endDate:     '2024-07-15T18:00:00Z',
  status:      CompetitionStatus.LIVE,
  scoringType: ScoringType.DYNAMIC,
  categories:        INITIAL_CATEGORIES,
  difficultyLevels:  INITIAL_DIFFICULTIES,
  topKBoulders:      6,
  dynamicPot:        1000,
  minDynamicPoints:  50,
  isLocked:          false,
  canSelfScore:      true,
  inviteCode:        'SUMMER24',
  rules: {
    en: '### Rules\n1. Log your tops in the app.\n2. Judges must sign off on Puntuable boulders.',
    es: '### Reglas\n1. Registra tus tops en la app.\n2. Los bloques Puntuables requieren juez.',
    ca: '### Regles\n1. Registra els teus tops a la app.\n2. Els blocs Puntuables requereixen jutge.',
  },
  penalizeAttempts:   true,
  penaltyType:        'fixed',
  penaltyValue:       20,
  minScorePerBoulder: 50,
  zoneScoring:        'adds_to_score',
  scoringMethod:      'self_scoring',
  // Attempt tracking defaults
  attemptTracking:    'fixed_options',
  maxFixedAttempts:   4,
}

// ─── MOCK BOULDERS ────────────────────────────────────────────────────────────

const COLORS = ['#38bdf8', '#fbbf24', '#f87171', '#4ade80', '#c084fc', '#ffffff', '#000000']

export const MOCK_BOULDERS: Boulder[] = Array.from({ length: 15 }, (_, i) => ({
  id:           `b-${i + 1}`,
  number:       i + 1,
  name:         i % 7 === 0 ? 'Beta Blaster' : undefined,
  color:        COLORS[i % COLORS.length],
  difficultyId: INITIAL_DIFFICULTIES[i % 9].id,
  style:        ['Slab', 'Overhang', 'Dyno'][i % 3],
  isPuntuable:  i < 3,
  tags:         [],
  status:       'active',
  zoneCount:    i < 3 ? 2 : 0,
  // Puntuable boulders override to 'count' so judges get the stepper;
  // regular boulders inherit the competition default.
  attemptTrackingOverride: i < 3 ? 'count' : undefined,
}))

// ─── MOCK COMPETITORS ─────────────────────────────────────────────────────────

export const MOCK_COMPETITORS: Competitor[] = [
  {
    id: 'u-admin', firstName: 'Admin', lastName: 'Organizer',
    displayName: 'Admin O.', email: 'admin@climbtracker.com',
    gender: 'Other', categoryId: 'cat-1', bibNumber: 0,
    role: 'organizer',
  },
  {
    id: 'u-1', firstName: 'Alex', lastName: 'Honnold',
    displayName: 'Alex H.', email: 'alex@example.com',
    gender: 'Male', categoryId: 'cat-1', bibNumber: 101,
    role: 'competitor',
  },
  {
    id: 'u-2', firstName: 'Janja', lastName: 'Garnbret',
    displayName: 'Janja G.', email: 'janja@example.com',
    gender: 'Female', categoryId: 'cat-2', bibNumber: 102,
    role: 'competitor',
  },
  {
    id: 'u-3', firstName: 'Adam', lastName: 'Ondra',
    displayName: 'Adam O.', email: 'adam@example.com',
    gender: 'Male', categoryId: 'cat-1', bibNumber: 103,
    role: 'competitor',
  },
  {
    id: 'u-4', firstName: 'Brooke', lastName: 'Raboutou',
    displayName: 'Brooke R.', email: 'brooke@example.com',
    gender: 'Female', categoryId: 'cat-2', bibNumber: 104,
    role: 'competitor',
  },
]

// ─── MOCK COMPLETIONS ─────────────────────────────────────────────────────────

export const MOCK_COMPLETIONS: Completion[] = [
  { competitorId: 'u-1', boulderId: 'b-1', attempts: 1, timestamp: Date.now() - 3600000, hasZone: true, zoneAttempts: 1, zonesReached: 2, topValidated: true },
  { competitorId: 'u-1', boulderId: 'b-2', attempts: 2, timestamp: Date.now() - 3000000, hasZone: true, zoneAttempts: 1, zonesReached: 1, topValidated: true },
  { competitorId: 'u-2', boulderId: 'b-1', attempts: 1, timestamp: Date.now() - 3500000, hasZone: true, zoneAttempts: 1, zonesReached: 2, topValidated: true },
  { competitorId: 'u-3', boulderId: 'b-1', attempts: 1, timestamp: Date.now() - 3400000, hasZone: true, zoneAttempts: 1, zonesReached: 1, topValidated: true },
  { competitorId: 'u-3', boulderId: 'b-3', attempts: 3, timestamp: Date.now() - 3300000, hasZone: true, zoneAttempts: 2, zonesReached: 2, topValidated: true },
  { competitorId: 'u-4', boulderId: 'b-2', attempts: 2, timestamp: Date.now() - 3200000, hasZone: false, zoneAttempts: 0, zonesReached: 0, topValidated: true },
]