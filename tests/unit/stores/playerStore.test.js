import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '@/stores/playerStore.js'

describe('playerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('reset', () => {
    /**
     * @goal   Verify reset restores hp to base value (100)
     * @input  store.hp mutated to 10, then reset() called
     * @expect store.hp === 100
     */
    it('resets hp to 100', () => {
      const store = usePlayerStore()
      store.hp = 10
      store.reset()
      expect(store.hp).toBe(100)
    })

    /**
     * @goal   Verify reset restores maxHp to base value (100)
     * @input  store.maxHp mutated to 50, then reset() called
     * @expect store.maxHp === 100
     */
    it('resets maxHp to 100', () => {
      const store = usePlayerStore()
      store.maxHp = 50
      store.reset()
      expect(store.maxHp).toBe(100)
    })

    /**
     * @goal   Verify reset zeroes out gold accumulated during a run
     * @input  store.gold mutated to 999, then reset() called
     * @expect store.gold === 0
     */
    it('resets gold to 0', () => {
      const store = usePlayerStore()
      store.gold = 999
      store.reset()
      expect(store.gold).toBe(0)
    })

    /**
     * @goal   Verify reset clears all active debuffs
     * @input  activeDebuffs contains one debuff, then reset() called
     * @expect activeDebuffs is an empty array
     */
    it('clears activeDebuffs', () => {
      const store = usePlayerStore()
      store.activeDebuffs = [{ type: 'damage', magnitude: 0.2, expireAfterCombat: true }]
      store.reset()
      expect(store.activeDebuffs).toEqual([])
    })
  })

  describe('applyDamage', () => {
    /**
     * @goal   Verify hp decreases by the exact damage amount
     * @input  hp=100 (default), applyDamage(30)
     * @expect hp === 70
     */
    it('reduces hp by the given amount', () => {
      const store = usePlayerStore()
      store.applyDamage(30)
      expect(store.hp).toBe(70)
    })

    /**
     * @goal   Verify hp cannot go below 0 (no negative health)
     * @input  hp=100 (default), applyDamage(9999)
     * @expect hp === 0
     */
    it('does not reduce hp below 0', () => {
      const store = usePlayerStore()
      store.applyDamage(9999)
      expect(store.hp).toBe(0)
    })

    /**
     * @goal   Verify hp lands exactly at 0 when damage equals current hp
     * @input  hp=100, applyDamage(100)
     * @expect hp === 0
     */
    it('hp stays at 0 when damage equals current hp', () => {
      const store = usePlayerStore()
      store.applyDamage(100)
      expect(store.hp).toBe(0)
    })
  })

  describe('heal', () => {
    /**
     * @goal   Verify hp increases by the exact heal amount
     * @input  hp=50, heal(20)
     * @expect hp === 70
     */
    it('increases hp by the given amount', () => {
      const store = usePlayerStore()
      store.hp = 50
      store.heal(20)
      expect(store.hp).toBe(70)
    })

    /**
     * @goal   Verify hp cannot exceed maxHp when healing overshoot
     * @input  hp=90, maxHp=100, heal(50)
     * @expect hp === maxHp (100)
     */
    it('does not exceed maxHp', () => {
      const store = usePlayerStore()
      store.hp = 90
      store.heal(50)
      expect(store.hp).toBe(store.maxHp)
    })

    /**
     * @goal   Verify heal on full hp keeps hp at maxHp without error
     * @input  hp=100 (default, already full), heal(100)
     * @expect hp === maxHp (100)
     */
    it('hp stays at maxHp when heal equals or exceeds gap', () => {
      const store = usePlayerStore()
      store.heal(100)
      expect(store.hp).toBe(store.maxHp)
    })
  })

  describe('spendGold', () => {
    /**
     * @goal   Verify gold is correctly deducted when player has enough funds
     * @input  gold=50, spendGold(30)
     * @expect gold === 20
     */
    it('deducts gold when player has enough', () => {
      const store = usePlayerStore()
      store.gold = 50
      store.spendGold(30)
      expect(store.gold).toBe(20)
    })

    /**
     * @goal   Verify an error is thrown when player cannot afford the cost (SC-009)
     * @input  gold=10, spendGold(15)
     * @expect throws Error (insufficient gold)
     */
    it('throws an error when gold is insufficient', () => {
      const store = usePlayerStore()
      store.gold = 10
      expect(() => store.spendGold(15)).toThrow()
    })

    /**
     * @goal   Verify spending exactly the available gold succeeds and leaves 0
     * @input  gold=15, spendGold(15)
     * @expect gold === 0, no error thrown
     */
    it('deducts exactly the available amount without error', () => {
      const store = usePlayerStore()
      store.gold = 15
      store.spendGold(15)
      expect(store.gold).toBe(0)
    })
  })

  describe('addGold', () => {
    /**
     * @goal   Verify gold accumulates correctly after a reward
     * @input  gold=0 (default), addGold(20)
     * @expect gold === 20
     */
    it('increases gold by given amount', () => {
      const store = usePlayerStore()
      store.addGold(20)
      expect(store.gold).toBe(20)
    })
  })

  describe('clearCombatDebuffs', () => {
    /**
     * @goal   Verify debuffs flagged expireAfterCombat=true are removed, others kept
     * @input  Two debuffs: one expiring, one permanent
     * @expect only the permanent debuff remains (length 1, expireAfterCombat=false)
     */
    it('removes debuffs with expireAfterCombat=true', () => {
      const store = usePlayerStore()
      store.activeDebuffs = [
        { type: 'damage', magnitude: 0.2, expireAfterCombat: true },
        { type: 'speed', magnitude: 0.1, expireAfterCombat: false },
      ]
      store.clearCombatDebuffs()
      expect(store.activeDebuffs).toHaveLength(1)
      expect(store.activeDebuffs[0].expireAfterCombat).toBe(false)
    })

    /**
     * @goal   Verify permanent debuffs (expireAfterCombat=false) are NOT removed
     * @input  One permanent debuff only
     * @expect activeDebuffs still has 1 entry
     */
    it('keeps debuffs with expireAfterCombat=false', () => {
      const store = usePlayerStore()
      store.activeDebuffs = [
        { type: 'hp', magnitude: 0.15, expireAfterCombat: false },
      ]
      store.clearCombatDebuffs()
      expect(store.activeDebuffs).toHaveLength(1)
    })

    /**
     * @goal   Verify activeDebuffs becomes empty when all debuffs are combat-expiring
     * @input  Two debuffs, both with expireAfterCombat=true
     * @expect activeDebuffs === []
     */
    it('results in empty array when all debuffs expire after combat', () => {
      const store = usePlayerStore()
      store.activeDebuffs = [
        { type: 'damage', magnitude: 0.2, expireAfterCombat: true },
        { type: 'speed', magnitude: 0.3, expireAfterCombat: true },
      ]
      store.clearCombatDebuffs()
      expect(store.activeDebuffs).toEqual([])
    })
  })
})

