import { describe, it, expect } from 'vitest'
import { attemptPurchase, generateShopCatalog } from '@/engine/simulation/ShopSystem.js'

/**
 * Unit tests for ShopSystem (T041).
 * SC-009: Shop items must cost >= 15 gold. Purchases require sufficient funds.
 */

describe('ShopSystem', () => {
  // ---------------------------------------------------------------------------
  // attemptPurchase
  // ---------------------------------------------------------------------------
  describe('attemptPurchase', () => {
    /**
     * @goal   Successful purchase returns { success: true, card } when player has enough gold
     * @input  playerGold=30, item={ id: 'sword', cost: 20 }
     * @expect { success: true, card: item }
     */
    it('returns success:true and the card when player has enough gold', () => {
      const item = { id: 'sword', cost: 20 }
      const result = attemptPurchase(30, item)
      expect(result.success).toBe(true)
      expect(result.card).toBe(item)
    })

    /**
     * @goal   Successful purchase works when playerGold equals item cost exactly
     * @input  playerGold=15, item={ id: 'dagger', cost: 15 }
     * @expect { success: true }
     */
    it('returns success:true when player gold equals item cost exactly', () => {
      const item = { id: 'dagger', cost: 15 }
      const result = attemptPurchase(15, item)
      expect(result.success).toBe(true)
    })

    /**
     * @goal   Insufficient funds returns { success: false } without modifying anything
     * @input  playerGold=10, item={ id: 'armor', cost: 50 }
     * @expect { success: false }
     */
    it('returns success:false when player has insufficient gold', () => {
      const item = { id: 'armor', cost: 50 }
      const result = attemptPurchase(10, item)
      expect(result.success).toBe(false)
    })

    /**
     * @goal   Items below minimum price (15) are rejected with an error (SC-009)
     * @input  playerGold=100, item={ cost: 10 }
     * @expect throws Error
     */
    it('throws an error when item.cost < 15', () => {
      const item = { id: 'cheap', cost: 10 }
      expect(() => attemptPurchase(100, item)).toThrow()
    })

    /**
     * @goal   Edge case: cost=14 is still below minimum
     * @input  playerGold=100, item={ cost: 14 }
     * @expect throws Error
     */
    it('throws an error when item.cost is 14 (one below minimum)', () => {
      const item = { id: 'almost', cost: 14 }
      expect(() => attemptPurchase(100, item)).toThrow()
    })
  })

  // ---------------------------------------------------------------------------
  // generateShopCatalog
  // ---------------------------------------------------------------------------
  describe('generateShopCatalog', () => {
    /**
     * @goal   Catalog never includes items with cost < 15 (SC-009)
     * @input  pool with one cheap card (cost=5) and two valid ones
     * @expect all returned items have cost >= 15
     */
    it('filters out items with cost < 15 from the catalog', () => {
      const pool = [
        { id: 'cheap', cost: 5 },
        { id: 'b', cost: 20 },
        { id: 'c', cost: 30 },
      ]
      const rng = () => 0
      const catalog = generateShopCatalog(pool, 3, rng)
      expect(catalog.every((item) => item.cost >= 15)).toBe(true)
    })

    /**
     * @goal   Returns exactly catalogSize items when pool has enough eligible cards
     * @input  pool of 4 valid cards, catalogSize=2
     * @expect catalog.length === 2
     */
    it('returns exactly catalogSize items when pool is large enough', () => {
      const pool = [
        { id: 'a', cost: 20 },
        { id: 'b', cost: 25 },
        { id: 'c', cost: 30 },
        { id: 'd', cost: 40 },
      ]
      const rng = () => 0
      const catalog = generateShopCatalog(pool, 2, rng)
      expect(catalog.length).toBe(2)
    })

    /**
     * @goal   Does not return duplicate cards in the same catalog
     * @input  pool of 3 valid cards, catalogSize=3
     * @expect no duplicate ids
     */
    it('does not include duplicate cards in one catalog', () => {
      const pool = [
        { id: 'a', cost: 20 },
        { id: 'b', cost: 25 },
        { id: 'c', cost: 30 },
      ]
      const rng = () => 0
      const catalog = generateShopCatalog(pool, 3, rng)
      const ids = catalog.map((c) => c.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    /**
     * @goal   Returns fewer items than catalogSize when pool has fewer eligible cards
     * @input  pool of 2 eligible cards, catalogSize=5
     * @expect catalog.length === 2
     */
    it('returns fewer items than catalogSize when pool is smaller', () => {
      const pool = [
        { id: 'a', cost: 20 },
        { id: 'b', cost: 25 },
      ]
      const rng = () => 0
      const catalog = generateShopCatalog(pool, 5, rng)
      expect(catalog.length).toBe(2)
    })
  })
})
