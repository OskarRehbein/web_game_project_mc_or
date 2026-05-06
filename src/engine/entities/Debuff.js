/**
 * Valid debuff types per spec Key Entities section.
 * - 'damage' : reduces outgoing damage
 * - 'speed'  : reduces movement speed
 * - 'hp'     : reduces max HP
 */
export const DEBUFF_TYPES = /** @type {const} */ (['damage', 'speed', 'hp'])

/**
 * @typedef {'damage'|'speed'|'hp'} DebuffType
 */

/**
 * @typedef {Object} Debuff
 * @property {DebuffType} type               - Stat being penalized
 * @property {number}     magnitude          - Reduction factor (0.1–0.3 per spec FR-036)
 * @property {boolean}    expireAfterCombat  - True → debuff clears at end of next combat
 */

/**
 * @description Creates a validated Debuff object representing a temporary
 *              stat penalty applied by sea events (FR-036). The debuff
 *              reduces damage, speed, or max HP by the given magnitude.
 * @param {DebuffType} type                    - Stat to penalize: 'damage' | 'speed' | 'hp'
 * @param {number}     magnitude               - Reduction factor; must be in range (0, 1) exclusive
 * @param {boolean}    [expireAfterCombat=true] - Whether the debuff clears after the next combat ends
 * @returns {Debuff} Validated Debuff object
 * @throws {Error} If `type` is not in DEBUFF_TYPES or `magnitude` is not in (0, 1)
 */
export function createDebuff(type, magnitude, expireAfterCombat = true) {
  if (!DEBUFF_TYPES.includes(type)) {
    throw new Error(`Invalid debuff type "${type}". Must be one of: ${DEBUFF_TYPES.join(', ')}`)
  }
  if (typeof magnitude !== 'number' || magnitude <= 0 || magnitude >= 1) {
    throw new Error(`Debuff magnitude must be a number between 0 (exclusive) and 1 (exclusive), got ${magnitude}`)
  }

  return {
    type,
    magnitude,
    expireAfterCombat: Boolean(expireAfterCombat),
  }
}
