import { describe, it, expect } from 'vitest'
import { resolveOutcome } from '@/engine/simulation/EventResolver.js'

/**
 * Unit tests for EventResolver.
 * T033 / FR-027 / FR-028 / plan contract:
 * - Weighted RNG uses the cumulative outcome weights.
 * - roll=0 selects the first outcome.
 * - roll=99.9 selects the last outcome when weights sum to 100.
 * - Floating-point edge cases fall back to the last outcome.
 */

describe('EventResolver', () => {
  it('returns the first outcome when the roll is 0', () => {
    const outcomes = [
      { id: 'first', weight: 50 },
      { id: 'second', weight: 30 },
      { id: 'third', weight: 20 },
    ]

    const result = resolveOutcome(outcomes, () => 0)

    expect(result.id).toBe('first')
  })

  it('returns the last outcome when the roll is 99.9', () => {
    const outcomes = [
      { id: 'first', weight: 50 },
      { id: 'second', weight: 30 },
      { id: 'third', weight: 20 },
    ]

    const result = resolveOutcome(outcomes, () => 0.999)

    expect(result.id).toBe('third')
  })

  it('falls back to the last outcome when floating-point accumulation misses the threshold', () => {
    const outcomes = [
      { id: 'first', weight: 33.3 },
      { id: 'second', weight: 33.3 },
      { id: 'third', weight: 33.3 },
    ]

    const result = resolveOutcome(outcomes, () => 0.999)

    expect(result.id).toBe('third')
  })
})