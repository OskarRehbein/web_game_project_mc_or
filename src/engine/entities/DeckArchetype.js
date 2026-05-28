import { createCard } from './Card.js'
import cardsJson from '@/assets/data/cards.json'

/** Cartas que solo deben obtenerse como drop de jefe, no en selección inicial. */
const BOSS_DROP_ONLY_CARD_IDS = new Set(['card_action_salty_fist'])

/**
 * Pool completo de cartas iniciales (9 cartas) cargado desde cards.json.
 * Cada entrada se valida con createCard para garantizar formato.
 * @type {import('./Card.js').Card[]}
 */
export const CARD_POOL = cardsJson.map((raw) => createCard(raw.id, raw))

/** Pool elegible para arquetipos iniciales (excluye drops exclusivos de jefes). */
const STARTER_CARD_POOL = CARD_POOL.filter((card) => !BOSS_DROP_ONLY_CARD_IDS.has(card.id))

/**
 * @description Devuelve todas las cartas del pool cuyo `type` coincide.
 * @param {'action'|'passive'|'utility'} type
 * @returns {import('./Card.js').Card[]}
 */
export function getCardsByType(type) {
  return STARTER_CARD_POOL.filter((c) => c.type === type)
}

/**
 * @description Selecciona aleatoriamente una carta del pool del tipo dado.
 *              Usa la función `rng` inyectada para permitir tests deterministas.
 * @param {'action'|'passive'|'utility'} type - Subtipo del pool del cual sacar la carta
 * @param {() => number}                 rng  - Generador de números pseudoaleatorios [0, 1)
 * @returns {import('./Card.js').Card} Una carta del pool de ese tipo
 * @throws {Error} Si no existen cartas del tipo solicitado en el pool
 */
export function pickRandomCardOfType(type, rng = Math.random) {
  const pool = getCardsByType(type)
  if (pool.length === 0) {
    throw new Error(`No cards of type "${type}" available in the pool`)
  }
  const index = Math.floor(rng() * pool.length)
  return pool[index]
}

/**
 * @typedef {Object} DeckArchetype
 * @property {'pirata'|'navegante'} id
 * @property {string}               name
 * @property {string}               description
 * @property {Array<'action'|'passive'|'utility'>} composition
 *           Lista de subtipos: por cada entrada se elige 1 carta aleatoria del pool.
 */

/**
 * Arquetipos iniciales (FR-012 actualizado a 2 arquetipos con composición aleatoria).
 * @type {Record<string, DeckArchetype>}
 */
export const ARCHETYPES = {
  pirata: {
    id: 'pirata',
    name: 'Pirata',
    description: 'Combate directo. Recibes una carta de Acción y una de Utilidad elegidas al azar del pool.',
    composition: ['action', 'utility'],
  },
  navegante: {
    id: 'navegante',
    name: 'Navegante',
    description: 'Resistencia y exploración. Recibes una carta Pasiva y una de Utilidad elegidas al azar del pool.',
    composition: ['passive', 'utility'],
  },
}

/**
 * @description Construye el mazo inicial para un arquetipo. Por cada subtipo
 *              listado en `composition`, se elige al azar una carta del pool
 *              de ese subtipo (cada subtipo es independiente).
 * @param {'pirata'|'navegante'} archetypeId
 * @param {() => number}         [rng=Math.random]
 * @returns {import('./Card.js').Card[]} Mazo inicial generado (mismo tamaño que `composition`)
 * @throws {Error} Si `archetypeId` no existe
 */
export function buildDeck(archetypeId, rng = Math.random) {
  const archetype = ARCHETYPES[archetypeId]
  if (!archetype) {
    throw new Error(
      `Unknown archetype id: "${archetypeId}". Must be one of: ${Object.keys(ARCHETYPES).join(', ')}`,
    )
  }
  return archetype.composition.map((type) => pickRandomCardOfType(type, rng))
}
