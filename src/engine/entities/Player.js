/**
 * Player entity — pure JS, no Vue/PixiJS imports.
 *
 * Base stats per spec clarifications:
 *   HP      = 100
 *   damage  = 10
 *   speed   = 200 px/s
 *
 * Damage formula (FR-019, spec clarifications):
 *   daño_final = (damage_base + flat_bonus) × multiplicador × debuffMult
 */

const BASE_HP = 100
const BASE_DAMAGE = 10
const BASE_SPEED = 200

/**
 * @typedef {import('./Debuff.js').Debuff} Debuff
 * @typedef {import('./Card.js').Card} Card
 */

/**
 * @typedef {Object} PlayerStats
 * @property {number} damage - Final damage after passives and debuffs
 * @property {number} speed  - Movement speed in px/s after debuffs
 * @property {number} maxHp  - Max HP after passive flat bonuses and debuffs
 */

export class Player {
  constructor() {
    this.hp = BASE_HP
    this.maxHp = BASE_HP
    /** @type {Debuff[]} */
    this.activeDebuffs = []
    this._baseDamage = BASE_DAMAGE
    this._baseSpeed = BASE_SPEED
  }

  /**
   * @description Computes the player's effective stats by first summing all flat
   *              bonuses and multipliers from Passive cards, then applying active
   *              debuff reductions multiplicatively. Implements the core damage
   *              formula: daño_final = (base + flatBonus) × mult × debuffMult (FR-019).
   * @param {Card[]} passiveCards - Cards of type 'passive' currently in the deck
   * @returns {PlayerStats} Object with computed `damage`, `speed`, and `maxHp` values (all rounded)
   */
  computeStats(passiveCards) {
    let flatDamage = 0
    let damageMult = 1
    let flatHp = 0

    for (const card of passiveCards) {
      if (card.type !== 'passive') continue
      const e = card.effect
      if (e.flatDamage) flatDamage += e.flatDamage
      if (e.damageMult) damageMult *= e.damageMult
      if (e.flatHp) flatHp += e.flatHp
    }

    let debuffDamageMult = 1
    let debuffSpeedMult = 1
    let debuffHpMult = 1

    for (const debuff of this.activeDebuffs) {
      if (debuff.type === 'damage') debuffDamageMult *= 1 - debuff.magnitude
      if (debuff.type === 'speed') debuffSpeedMult *= 1 - debuff.magnitude
      if (debuff.type === 'hp') debuffHpMult *= 1 - debuff.magnitude
    }

    const damage = Math.round((this._baseDamage + flatDamage) * damageMult * debuffDamageMult)
    const speed = Math.round(this._baseSpeed * debuffSpeedMult)
    const maxHp = Math.round((BASE_HP + flatHp) * debuffHpMult)

    return { damage, speed, maxHp }
  }
}
