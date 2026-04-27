import type { DifficultyLevel } from './types'

// ─── DIFFICULTY LEVELS ────────────────────────────────────────────────────────
// Default difficulty scale used when creating a new competition.

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
