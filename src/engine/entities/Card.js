/**
 * Valid card types per spec FR-006 and Key Entities section.
 * 'weapon' and 'armor' are modeled as Card with extended type (FR-050).
 */
export const CARD_TYPES = /** @type {const} */ (['action', 'passive', 'utility', 'weapon', 'armor'])

export const CARD_RARITIES = /** @type {const} */ (['common', 'rare', 'unique'])

/**
 * @typedef {Object} CardEffect
 * @property {number} [flatDamage]   - Flat bonus added to base damage (Passive cards)
 * @property {number} [damageMult]   - Damage multiplier applied after flat bonus (Passive cards)
 * @property {number} [flatHp]       - Flat HP increase (Passive cards)
 * @property {number} [damage]       - Damage dealt on activation (Action cards)
 * @property {number} [heal]         - HP restored on activation (Action cards)
 */

/**
 * @typedef {'action'|'passive'|'utility'|'weapon'|'armor'} CardType
 * @typedef {'common'|'rare'|'unique'} CardRarity
 */

/**
 * @typedef {Object} Card
 * @property {string}     id          - Unique identifier
 * @property {string}     name        - Display name
 * @property {CardType}   type        - Card type determines usage context
 * @property {string}     description - Human-readable description
 * @property {CardRarity} rarity      - Rarity tier (common 15–25, rare 40–70, unique N/A)
 * @property {CardEffect} effect      - Effect payload (shape depends on type)
 * @property {number}     cost        - Shop cost in gold coins
 * @property {number}     [cooldown]  - Cooldown in seconds; only present on 'action' cards
 */

/**
 * @description Creates a validated Card object from raw data, enforcing all
 *              type and rarity constraints defined in the spec.
 * @param {string}       id   - Unique card identifier (non-empty string)
 * @param {Partial<Card>} data - Raw card data; `description` and `effect` are optional
 * @returns {Card} Fully validated Card object ready for use in stores or JSON
 * @throws {Error} If `id` is empty, `name` is missing, `type` is not in CARD_TYPES,
 *                 `rarity` is not in CARD_RARITIES, `cost` is not a non-negative number,
 *                 or `cooldown` is negative when provided on an action card
 */
export function createCard(id, data) {
  if (!id || typeof id !== 'string') {
    throw new Error('Card id must be a non-empty string')
  }
  if (!data.name || typeof data.name !== 'string') {
    throw new Error(`Card "${id}" must have a non-empty name`)
  }
  if (!CARD_TYPES.includes(data.type)) {
    throw new Error(`Card "${id}" has invalid type "${data.type}". Must be one of: ${CARD_TYPES.join(', ')}`)
  }
  if (!CARD_RARITIES.includes(data.rarity)) {
    throw new Error(`Card "${id}" has invalid rarity "${data.rarity}". Must be one of: ${CARD_RARITIES.join(', ')}`)
  }
  if (typeof data.cost !== 'number' || data.cost < 0) {
    throw new Error(`Card "${id}" must have a non-negative numeric cost`)
  }

  /** @type {Card} */
  const card = {
    id,
    name: data.name,
    type: data.type,
    description: data.description ?? '',
    rarity: data.rarity,
    effect: data.effect ?? {},
    cost: data.cost,
  }

  if (data.type === 'action') {
    if (data.cooldown !== undefined) {
      if (typeof data.cooldown !== 'number' || data.cooldown < 0) {
        throw new Error(`Card "${id}" cooldown must be a non-negative number`)
      }
      card.cooldown = data.cooldown
    }
  }

  return card
}
