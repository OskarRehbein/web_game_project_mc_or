/**
 * DamageCalculator — pure JS engine module, no Vue/PixiJS imports.
 *
 * Implements the damage formula from FR-019:
 *   daño_final = (damage_base + flat_bonus) × mult × debuffMult
 *
 * - flat_bonus: sum of `effect.flatDamage` from all passive cards
 * - mult: product of `effect.damageMult` from all passive cards
 * - debuffMult: product of (1 - magnitude) for each 'damage' type debuff
 * - Result is rounded to the nearest integer (Math.round)
 */

/**
 * @typedef {Object} PassiveCard
 * @property {'passive'} type
 * @property {{ flatDamage?: number, damageMult?: number }} effect
 */

/**
 * @typedef {Object} DamageDebuff
 * @property {'damage'|'speed'|'hp'} type
 * @property {number} magnitude - Reduction factor in [0, 1]; 0.25 means −25%
 */

/**
 * @description Calculates final player damage by applying passive card bonuses
 *              and active debuff reductions to the given base value.
 *              Formula: Math.round((base + flatBonus) × mult × debuffMult)
 *              Only cards with type === 'passive' contribute; non-passive entries are skipped.
 *              Only debuffs with type === 'damage' affect this calculation.
 * @param {number}        base     - Base damage value (typically 10 per FR-019)
 * @param {PassiveCard[]} passives - Array of passive cards currently in the deck
 * @param {DamageDebuff[]} debuffs - Array of active debuffs on the player
 * @returns {number} Final damage as a rounded integer (≥ 0)
 */
export function calculateDamage(base, passives, debuffs) {
  let flatBonus = 0
  let mult = 1

  for (const card of passives) {
    if (card.type !== 'passive') continue
    const e = card.effect
    if (e.flatDamage) flatBonus += e.flatDamage
    if (e.damageMult) mult *= e.damageMult
  }

  let debuffMult = 1
  for (const debuff of debuffs) {
    if (debuff.type === 'damage') {
      debuffMult *= 1 - debuff.magnitude
    }
  }

  return Math.round((base + flatBonus) * mult * debuffMult)
}
