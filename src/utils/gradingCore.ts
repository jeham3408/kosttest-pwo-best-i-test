import type { GradeLetter } from '../data/pwoProducts'

export function letterFromScore(score: number): GradeLetter {
  if (score >= 61) return 'A'
  if (score >= 49) return 'B'
  if (score >= 36) return 'C'
  if (score >= 24) return 'D'
  if (score >= 12) return 'E'
  return 'F'
}

export function letterFromRatio(ratio: number): GradeLetter {
  return letterFromScore(Math.round(Math.max(0, Math.min(1, ratio)) * 100))
}

export function scoreLinear(value: number, min: number, max: number): number {
  if (value <= min) return 0
  if (value >= max) return 1
  return (value - min) / (max - min)
}
