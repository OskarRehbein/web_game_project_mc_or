import { describe, it, expect } from 'vitest'
import { generateIslandOptions, applyIslandResult } from '@/engine/simulation/MapGenerator.js'

/**
 * Unit tests for MapGenerator.
 * T032 / FR-023 / FR-030 / edge-case coverage from the spec:
 * - Exactly 3 island options are produced.
 * - The immediately previous island is not repeated when alternatives exist.
 * - When the pool is exhausted, the generator samples with replacement.
 */

describe('MapGenerator', () => {
  describe('generateIslandOptions', () => {
    it('returns exactly 3 options when the bank has enough unique islands', () => {
      const bank = [
        { id: 'a', name: 'Isla A', type: 'regular' },
        { id: 'b', name: 'Isla B', type: 'regular' },
        { id: 'c', name: 'Isla C', type: 'regular' },
        { id: 'd', name: 'Isla D', type: 'regular' },
      ]
      let callCount = 0
      const rng = () => [(0.1), (0.4), (0.7)][callCount++] || 0

      const options = generateIslandOptions(bank, 3, null, rng)

      expect(options).toHaveLength(3)
      expect(new Set(options.map((island) => island.id)).size).toBe(3)
    })

    it('does not include the immediately previous island when an alternative exists', () => {
      const bank = [
        { id: 'a', name: 'Isla A', type: 'regular' },
        { id: 'b', name: 'Isla B', type: 'regular' },
        { id: 'c', name: 'Isla C', type: 'regular' },
      ]
      let callCount = 0
      const rng = () => [(0.1), (0.6), (0.1)][callCount++] || 0

      const options = generateIslandOptions(bank, 3, 'b', rng)

      expect(options).toHaveLength(3)
      expect(options.some((island) => island.id === 'b')).toBe(false)
    })

    it('samples with replacement once the filtered pool is exhausted', () => {
      const bank = [
        { id: 'a', name: 'Isla A', type: 'regular' },
        { id: 'b', name: 'Isla B', type: 'regular' },
      ]
      let callCount = 0
      const rng = () => [(0.1), (0.6), (0.1)][callCount++] || 0

      const options = generateIslandOptions(bank, 3, null, rng)

      expect(options).toHaveLength(3)
      expect(new Set(options.map((island) => island.id)).size).toBe(2)
      expect(options.every((island) => ['a', 'b'].includes(island.id))).toBe(true)
    })
  })

  describe('applyIslandResult', () => {
    it('returns a completed copy of the island', () => {
      const island = { id: 'island-1', name: 'Isla' }

      const result = applyIslandResult(island)

      expect(result).not.toBe(island)
      expect(result.isCompleted).toBe(true)
      expect(result.id).toBe('island-1')
    })
  })
})