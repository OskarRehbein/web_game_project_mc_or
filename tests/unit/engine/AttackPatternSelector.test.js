import { describe, it, expect } from 'vitest'
import {
  getEligiblePatterns,
  pickPattern,
} from '@/engine/combat/AttackPatternSelector.js'

/**
 * Unit tests for AttackPatternSelector.
 * getEligiblePatterns filters boss patterns by hpThreshold.
 * pickPattern randomly selects one from eligible patterns using an injected rng.
 */

describe('AttackPatternSelector', () => {

  describe('getEligiblePatterns', () => {
    /**
     * @goal   Patterns without hpThreshold are always eligible (active from 100% HP)
     * @input  patterns=[{id:'a'},{id:'b'}], bossHp=50, bossMaxHp=100
     * @expect both patterns returned
     */
    it('returns all patterns when none have hpThreshold', () => {
      const patterns = [
        { id: 'a', telegraphDurationMs: 1000 },
        { id: 'b', telegraphDurationMs: 1500 },
      ]
      const result = getEligiblePatterns(patterns, 50, 100)
      expect(result).toHaveLength(2)
    })

    /**
     * @goal   A pattern with hpThreshold=0.5 only appears when bossHp <= 50% of bossMaxHp
     * @input  patterns=[{id:'rage', hpThreshold:0.5}], bossHp=60, bossMaxHp=100
     * @expect empty array — boss is above threshold
     */
    it('excludes patterns whose hpThreshold has not been reached', () => {
      const patterns = [{ id: 'rage', hpThreshold: 0.5, telegraphDurationMs: 1000 }]
      const result = getEligiblePatterns(patterns, 60, 100)
      expect(result).toHaveLength(0)
    })

    /**
     * @goal   Pattern becomes eligible exactly when bossHp <= hpThreshold × bossMaxHp
     * @input  hpThreshold=0.5, bossHp=50, bossMaxHp=100
     * @expect pattern included (50 <= 50)
     */
    it('includes pattern when bossHp is exactly at hpThreshold', () => {
      const patterns = [{ id: 'rage', hpThreshold: 0.5, telegraphDurationMs: 1000 }]
      const result = getEligiblePatterns(patterns, 50, 100)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('rage')
    })

    /**
     * @goal   Mix of threshold and non-threshold patterns — only eligible ones returned
     * @input  [{id:'normal'}, {id:'rage', hpThreshold:0.3}], bossHp=50, bossMaxHp=100
     * @expect only 'normal' returned (boss at 50%, threshold needs 30%)
     */
    it('returns only eligible patterns from a mixed list', () => {
      const patterns = [
        { id: 'normal', telegraphDurationMs: 1000 },
        { id: 'rage', hpThreshold: 0.3, telegraphDurationMs: 1200 },
      ]
      const result = getEligiblePatterns(patterns, 50, 100)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('normal')
    })

    /**
     * @goal   All threshold patterns unlock when boss HP is very low
     * @input  two patterns with hpThreshold=0.5 and 0.25, bossHp=10, bossMaxHp=100
     * @expect both returned
     */
    it('returns all patterns when boss HP is below every threshold', () => {
      const patterns = [
        { id: 'phase2', hpThreshold: 0.5, telegraphDurationMs: 1000 },
        { id: 'phase3', hpThreshold: 0.25, telegraphDurationMs: 1000 },
      ]
      const result = getEligiblePatterns(patterns, 10, 100)
      expect(result).toHaveLength(2)
    })
  })

  describe('pickPattern', () => {
    /**
     * @goal   Throws when eligible list is empty (no valid patterns — combat logic error)
     * @input  eligible=[], rng=Math.random
     * @expect throws Error with descriptive message
     */
    it('throws an error when no eligible patterns are provided', () => {
      expect(() => pickPattern([], Math.random)).toThrow(
        /no eligible patterns/i
      )
    })

    /**
     * @goal   Returns the only pattern when list has one element (regardless of rng)
     * @input  eligible=[{id:'solo'}], rng=()=>0.9
     * @expect the single pattern
     */
    it('returns the only pattern when eligible list has one element', () => {
      const patterns = [{ id: 'solo', telegraphDurationMs: 1000 }]
      const result = pickPattern(patterns, () => 0.9)
      expect(result.id).toBe('solo')
    })

    /**
     * @goal   rng=0 picks first pattern (floor(0 × length) === 0)
     * @input  eligible=[{id:'first'},{id:'second'}], rng=()=>0
     * @expect {id:'first'}
     */
    it('picks first pattern when rng returns 0', () => {
      const patterns = [
        { id: 'first', telegraphDurationMs: 1000 },
        { id: 'second', telegraphDurationMs: 1500 },
      ]
      const result = pickPattern(patterns, () => 0)
      expect(result.id).toBe('first')
    })

    /**
     * @goal   rng close to 1 picks the last pattern
     * @input  eligible=[{id:'a'},{id:'b'},{id:'c'}], rng=()=>0.999
     * @expect {id:'c'}
     */
    it('picks last pattern when rng returns value close to 1', () => {
      const patterns = [
        { id: 'a', telegraphDurationMs: 1000 },
        { id: 'b', telegraphDurationMs: 1000 },
        { id: 'c', telegraphDurationMs: 1000 },
      ]
      const result = pickPattern(patterns, () => 0.999)
      expect(result.id).toBe('c')
    })

    /**
     * @goal   Does not mutate the original eligible array
     * @input  eligible=[{id:'x'}]
     * @expect original array unchanged after call
     */
    it('does not mutate the eligible patterns array', () => {
      const patterns = [{ id: 'x', telegraphDurationMs: 1000 }]
      const original = [...patterns]
      pickPattern(patterns, Math.random)
      expect(patterns).toEqual(original)
    })
  })
})
