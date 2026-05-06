import { describe, it, expect } from 'vitest'
import { calculateDamage } from '@/engine/combat/DamageCalculator.js'

/**
 * Unit tests for DamageCalculator.
 * Formula (FR-019): daño_final = (base + flatBonus) × mult × debuffMult
 * Result is Math.round()'d to an integer.
 */

describe('DamageCalculator', () => {

  describe('calculateDamage — no passives, no debuffs', () => {
    /**
     * @goal   Returns base damage unchanged when there are no passives or debuffs
     * @input  base=10, passives=[], debuffs=[]
     * @expect 10
     */
    it('returns base damage with empty passives and debuffs', () => {
      expect(calculateDamage(10, [], [])).toBe(10)
    })

    /**
     * @goal   Works with any numeric base value
     * @input  base=25, passives=[], debuffs=[]
     * @expect 25
     */
    it('returns custom base damage when no modifiers present', () => {
      expect(calculateDamage(25, [], [])).toBe(25)
    })
  })

  describe('calculateDamage — flatDamage from passives', () => {
    /**
     * @goal   A single passive with flatDamage adds it to base before multiplying
     * @input  base=10, passives=[{effect:{flatDamage:5}}], debuffs=[]
     * @expect 15
     */
    it('adds flatDamage from one passive card to base', () => {
      const passives = [{ type: 'passive', effect: { flatDamage: 5 } }]
      expect(calculateDamage(10, passives, [])).toBe(15)
    })

    /**
     * @goal   Multiple passives with flatDamage accumulate additively
     * @input  base=10, passives=[{flatDamage:3},{flatDamage:7}], debuffs=[]
     * @expect 20
     */
    it('sums flatDamage from multiple passive cards', () => {
      const passives = [
        { type: 'passive', effect: { flatDamage: 3 } },
        { type: 'passive', effect: { flatDamage: 7 } },
      ]
      expect(calculateDamage(10, passives, [])).toBe(20)
    })

    /**
     * @goal   Non-passive cards in the array are ignored (only 'passive' type counts)
     * @input  base=10, passives=[action card with flatDamage:5], debuffs=[]
     * @expect 10
     */
    it('ignores non-passive cards when computing flatDamage', () => {
      const passives = [{ type: 'action', effect: { flatDamage: 5 } }]
      expect(calculateDamage(10, passives, [])).toBe(10)
    })
  })

  describe('calculateDamage — damageMult from passives', () => {
    /**
     * @goal   A passive with damageMult=1.5 multiplies (base + flat) by 1.5
     * @input  base=10, passives=[{damageMult:1.5}], debuffs=[]
     * @expect 15
     */
    it('applies damageMult multiplicatively after flatDamage', () => {
      const passives = [{ type: 'passive', effect: { damageMult: 1.5 } }]
      expect(calculateDamage(10, passives, [])).toBe(15)
    })

    /**
     * @goal   Two damageMult passives compound multiplicatively (not additively)
     * @input  base=10, passives=[{damageMult:2},{damageMult:1.5}], debuffs=[]
     * @expect 30  (10 × 2 × 1.5)
     */
    it('compounds multiple damageMult passives multiplicatively', () => {
      const passives = [
        { type: 'passive', effect: { damageMult: 2 } },
        { type: 'passive', effect: { damageMult: 1.5 } },
      ]
      expect(calculateDamage(10, passives, [])).toBe(30)
    })

    /**
     * @goal   flatDamage and damageMult from the same passive combine correctly:
     *         (base + flat) × mult
     * @input  base=10, passives=[{flatDamage:10, damageMult:2}], debuffs=[]
     * @expect 40  ((10+10)×2)
     */
    it('applies damageMult to (base + flatDamage) when both are present', () => {
      const passives = [{ type: 'passive', effect: { flatDamage: 10, damageMult: 2 } }]
      expect(calculateDamage(10, passives, [])).toBe(40)
    })
  })

  describe('calculateDamage — debuff reduction', () => {
    /**
     * @goal   A damage debuff with magnitude 0.25 reduces final damage by 25%
     * @input  base=10, passives=[], debuffs=[{type:'damage', magnitude:0.25}]
     * @expect 8  (10 × 0.75 = 7.5 → round → 8)
     */
    it('reduces damage by debuff magnitude (25%)', () => {
      const debuffs = [{ type: 'damage', magnitude: 0.25 }]
      expect(calculateDamage(10, [], debuffs)).toBe(8)
    })

    /**
     * @goal   A debuff of type 'speed' does NOT affect damage calculation
     * @input  base=10, passives=[], debuffs=[{type:'speed', magnitude:0.5}]
     * @expect 10
     */
    it('ignores non-damage debuffs in damage calculation', () => {
      const debuffs = [{ type: 'speed', magnitude: 0.5 }]
      expect(calculateDamage(10, [], debuffs)).toBe(10)
    })

    /**
     * @goal   Two damage debuffs compound multiplicatively
     * @input  base=10, passives=[], debuffs=[{magnitude:0.5},{magnitude:0.5}]
     * @expect 3  (10 × 0.5 × 0.5 = 2.5 → round → 3)
     */
    it('compounds multiple damage debuffs multiplicatively', () => {
      const debuffs = [
        { type: 'damage', magnitude: 0.5 },
        { type: 'damage', magnitude: 0.5 },
      ]
      expect(calculateDamage(10, [], debuffs)).toBe(3)
    })
  })

  describe('calculateDamage — combined passives + debuffs', () => {
    /**
     * @goal   Full formula: passives boost then debuffs reduce
     *         (base=10 + flat=5) × mult=2 × debuffMult=0.5 = 15
     * @input  base=10, passives=[{flatDamage:5,damageMult:2}], debuffs=[{magnitude:0.5}]
     * @expect 15
     */
    it('applies passives first, then debuffs — full formula', () => {
      const passives = [{ type: 'passive', effect: { flatDamage: 5, damageMult: 2 } }]
      const debuffs = [{ type: 'damage', magnitude: 0.5 }]
      expect(calculateDamage(10, passives, debuffs)).toBe(15)
    })

    /**
     * @goal   Result is always a rounded integer (Math.round)
     * @input  base=10, passives=[{damageMult:1.1}], debuffs=[{magnitude:0.1}]
     * @expect Math.round(10 × 1.1 × 0.9) = Math.round(9.9) = 10
     */
    it('returns a rounded integer', () => {
      const passives = [{ type: 'passive', effect: { damageMult: 1.1 } }]
      const debuffs = [{ type: 'damage', magnitude: 0.1 }]
      expect(calculateDamage(10, passives, debuffs)).toBe(10)
      expect(Number.isInteger(calculateDamage(10, passives, debuffs))).toBe(true)
    })
  })
})
