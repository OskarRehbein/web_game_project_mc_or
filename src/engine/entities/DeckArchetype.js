import { createCard } from './Card.js'

/**
 * Starting cards for each archetype, defined inline per spec FR-012.
 *
 * Archetype compositions (FR-012):
 *  - action      : 3 Action cards
 *  - balanced    : 1 Action + 1 Passive + 1 Utility
 *  - exploration : 1 Action + 1 Passive + 2 Utility
 */

const SLASH = createCard('slash', {
  name: 'Slash',
  type: 'action',
  description: 'A swift blade strike dealing 15 damage.',
  rarity: 'common',
  effect: { damage: 15 },
  cost: 15,
  cooldown: 2,
})

const HEAVY_BLOW = createCard('heavy_blow', {
  name: 'Heavy Blow',
  type: 'action',
  description: 'A powerful strike dealing 25 damage with a longer cooldown.',
  rarity: 'common',
  effect: { damage: 25 },
  cost: 20,
  cooldown: 4,
})

const QUICK_JAB = createCard('quick_jab', {
  name: 'Quick Jab',
  type: 'action',
  description: 'A fast light strike dealing 10 damage.',
  rarity: 'common',
  effect: { damage: 10 },
  cost: 15,
  cooldown: 1,
})

const IRON_SKIN = createCard('iron_skin', {
  name: 'Iron Skin',
  type: 'passive',
  description: 'Hardens your hull. +20 max HP.',
  rarity: 'common',
  effect: { flatHp: 20 },
  cost: 20,
})

const NAVIGATOR_CHART = createCard('navigator_chart', {
  name: "Navigator's Chart",
  type: 'utility',
  description: 'Unlocks a hidden route on any island event.',
  rarity: 'common',
  effect: {},
  cost: 15,
})

const SMUGGLER_PASS = createCard('smuggler_pass', {
  name: "Smuggler's Pass",
  type: 'utility',
  description: 'Grants access to restricted areas on island events.',
  rarity: 'common',
  effect: {},
  cost: 15,
})

/**
 * @typedef {Object} DeckArchetype
 * @property {'action'|'balanced'|'exploration'} id
 * @property {string} name
 * @property {string} description
 * @property {import('./Card.js').Card[]} startingCards
 */

/**
 * The three fixed deck archetypes available at the start of each run (FR-012).
 * @type {Record<string, DeckArchetype>}
 */
export const ARCHETYPES = {
  action: {
    id: 'action',
    name: 'Action',
    description: 'Pure combat focus. Three action cards for maximum damage output in battle.',
    startingCards: [SLASH, HEAVY_BLOW, QUICK_JAB],
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    description: 'Versatility from the start. One of each type for flexibility in combat and exploration.',
    startingCards: [SLASH, IRON_SKIN, NAVIGATOR_CHART],
  },
  exploration: {
    id: 'exploration',
    name: 'Exploration',
    description: 'Optimized for island events and locked decisions. Trade raw power for more options.',
    startingCards: [SLASH, IRON_SKIN, NAVIGATOR_CHART, SMUGGLER_PASS],
  },
}
