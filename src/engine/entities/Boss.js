/**
 * Boss entity — pure JS, no Vue/PixiJS imports.
 *
 * Per spec Key Entities section:
 *   - attackPatterns[] are all active from combat start (no phase-gating in this version)
 *   - hpThreshold? on AttackPattern is reserved for future use
 *   - telegraphDurationMs must be ≥ 1000 ms (FR-015, SC-002)
 */

/**
 * @typedef {import('./Card.js').Card} Card
 */

/**
 * @typedef {Object} Zone
 * @property {number} x      - Left edge in px
 * @property {number} y      - Top edge in px
 * @property {number} width  - Width in px
 * @property {number} height - Height in px
 */

/**
 * @typedef {Object} AttackPattern
 * @property {string}   id                  - Unique pattern identifier
 * @property {number}   telegraphDurationMs - Warning time before impact (≥ 1000)
 * @property {Zone[]}   damageZones         - Hitbox regions active at impact
 * @property {number}   damage              - HP damage dealt on hit
 * @property {number}   [hpThreshold]       - Reserved: % HP below which pattern activates (future use)
 */

/**
 * @typedef {Object} Boss
 * @property {string}          id              - Unique identifier
 * @property {string}          name            - Display name
 * @property {number}          hp              - Current hit points
 * @property {number}          maxHp           - Maximum hit points
 * @property {AttackPattern[]} attackPatterns  - All available attack patterns
 * @property {Card[]}          lootPool        - Cards eligible for loot on defeat (minor bosses)
 * @property {Card}            [uniqueCard]    - Exclusive card granted on defeat (major bosses, FR-040)
 * @property {boolean}         isMajor         - True for boss-island bosses; false for regular-island bosses
 */

/**
 * @description Creates a validated Boss object from raw data, enforcing
 *              that all attack patterns meet the minimum telegraph duration
 *              required by the spec (FR-015, SC-002).
 * @param {string}       id   - Unique boss identifier (non-empty string)
 * @param {Partial<Boss>} data - Raw boss data; `lootPool` defaults to []
 * @returns {Boss} Validated Boss object ready for use in combat
 * @throws {Error} If `id` is empty, `name` is missing, `hp`/`maxHp` are not positive,
 *                 `attackPatterns` is empty, or any pattern has `telegraphDurationMs < 1000`
 */
export function createBoss(id, data) {
  if (!id || typeof id !== 'string') {
    throw new Error('Boss id must be a non-empty string')
  }
  if (!data.name || typeof data.name !== 'string') {
    throw new Error(`Boss "${id}" must have a non-empty name`)
  }
  if (typeof data.hp !== 'number' || data.hp <= 0) {
    throw new Error(`Boss "${id}" must have positive hp`)
  }
  if (typeof data.maxHp !== 'number' || data.maxHp <= 0) {
    throw new Error(`Boss "${id}" must have positive maxHp`)
  }
  if (!Array.isArray(data.attackPatterns) || data.attackPatterns.length === 0) {
    throw new Error(`Boss "${id}" must have at least one attackPattern`)
  }
  for (const pattern of data.attackPatterns) {
    if (typeof pattern.telegraphDurationMs !== 'number' || pattern.telegraphDurationMs < 1000) {
      throw new Error(
        `Boss "${id}" pattern "${pattern.id}" telegraphDurationMs must be ≥ 1000 ms (got ${pattern.telegraphDurationMs})`
      )
    }
  }

  return {
    id,
    name: data.name,
    hp: data.hp,
    maxHp: data.maxHp,
    attackPatterns: data.attackPatterns,
    lootPool: data.lootPool ?? [],
    ...(data.uniqueCard !== undefined ? { uniqueCard: data.uniqueCard } : {}),
    isMajor: Boolean(data.isMajor),
  }
}
