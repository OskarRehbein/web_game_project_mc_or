import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDeckStore } from '@/stores/deckStore.js'
import { ARCHETYPES, CARD_POOL } from '@/engine/entities/DeckArchetype.js'

/** RNG determinista que devuelve siempre 0 (selecciona la primera carta del pool filtrado). */
const rngZero = () => 0

describe('deckStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initWithArchetype', () => {
    /**
     * @goal   Arquetipo 'pirata' produce 2 cartas: 1 action + 1 utility (FR-012)
     */
    it('pirata archetype produces 1 action + 1 utility', () => {
      const store = useDeckStore()
      store.initWithArchetype('pirata', rngZero)
      expect(store.cards).toHaveLength(2)
      expect(store.actionCards).toHaveLength(1)
      expect(store.utilityCards).toHaveLength(1)
      expect(store.passiveCards).toHaveLength(0)
    })

    /**
     * @goal   Arquetipo 'navegante' produce 2 cartas: 1 passive + 1 utility (FR-012)
     */
    it('navegante archetype produces 1 passive + 1 utility', () => {
      const store = useDeckStore()
      store.initWithArchetype('navegante', rngZero)
      expect(store.cards).toHaveLength(2)
      expect(store.passiveCards).toHaveLength(1)
      expect(store.utilityCards).toHaveLength(1)
      expect(store.actionCards).toHaveLength(0)
    })

    /**
     * @goal   Las cartas seleccionadas pertenecen al pool definido en cards.json
     */
    it('all selected cards belong to the CARD_POOL', () => {
      const store = useDeckStore()
      store.initWithArchetype('pirata', rngZero)
      const poolIds = CARD_POOL.map((c) => c.id)
      for (const card of store.cards) {
        expect(poolIds).toContain(card.id)
      }
    })

    /**
     * @goal   Puño Salado es drop exclusivo del Capitán Cangrejo y no debe salir en arquetipos
     */
    it('never rolls salty fist in starter archetype cards', () => {
      const store = useDeckStore()
      store.initWithArchetype('pirata', () => 0.999999)
      const actionCard = store.cards.find((c) => c.type === 'action')
      expect(actionCard?.id).not.toBe('card_action_salty_fist')
    })

    /**
     * @goal   Con un rng determinista, la composición es reproducible
     */
    it('is deterministic given a seeded rng', () => {
      const storeA = useDeckStore()
      storeA.initWithArchetype('pirata', () => 0)
      const idsA = storeA.cards.map((c) => c.id)

      setActivePinia(createPinia())
      const storeB = useDeckStore()
      storeB.initWithArchetype('pirata', () => 0)
      const idsB = storeB.cards.map((c) => c.id)

      expect(idsA).toEqual(idsB)
    })

    /**
     * @goal   Lanza error si el arquetipo no existe
     */
    it('throws when given an unknown archetype id', () => {
      const store = useDeckStore()
      expect(() => store.initWithArchetype('invalid')).toThrow()
    })

    /**
     * @goal   Solo existen exactamente 2 arquetipos
     */
    it('exposes exactly 2 archetypes: pirata and navegante', () => {
      expect(Object.keys(ARCHETYPES).sort()).toEqual(['navegante', 'pirata'])
    })
  })

  describe('addCard', () => {
    it('increases cards.length by 1', () => {
      const store = useDeckStore()
      store.addCard({ id: 'card_action_teleport', name: 'Teletransporte', type: 'action', rarity: 'common', effect: {}, cost: 20 })
      expect(store.cards).toHaveLength(1)
    })

    it('the added card is retrievable via hasCard', () => {
      const store = useDeckStore()
      store.addCard({ id: 'card_action_teleport', name: 'Teletransporte', type: 'action', rarity: 'common', effect: {}, cost: 20 })
      expect(store.hasCard('card_action_teleport')).toBe(true)
    })

    it('allows duplicate card entries', () => {
      const store = useDeckStore()
      const card = { id: 'card_action_teleport', name: 'Teletransporte', type: 'action', rarity: 'common', effect: {}, cost: 20 }
      store.addCard(card)
      store.addCard(card)
      expect(store.cards).toHaveLength(2)
    })
  })

  describe('removeCard', () => {
    it('removes only one instance of a utility card', () => {
      const store = useDeckStore()
      const card = { id: 'card_utility_master_key', name: 'Llave Maestra', type: 'utility', rarity: 'common', effect: {}, cost: 15 }
      store.addCard(card)
      store.addCard(card)
      store.removeCard('card_utility_master_key')
      expect(store.cards).toHaveLength(1)
    })

    it('does nothing when card id is not found', () => {
      const store = useDeckStore()
      expect(() => store.removeCard('nonexistent')).not.toThrow()
      expect(store.cards).toHaveLength(0)
    })
  })

  describe('getters', () => {
    it('actionCards returns only action-type cards', () => {
      const store = useDeckStore()
      store.addCard({ id: 'a', name: 'A', type: 'action', rarity: 'common', effect: {}, cost: 20 })
      store.addCard({ id: 'b', name: 'B', type: 'passive', rarity: 'common', effect: {}, cost: 20 })
      expect(store.actionCards).toHaveLength(1)
      expect(store.actionCards[0].id).toBe('a')
    })

    it('passiveCards returns only passive-type cards', () => {
      const store = useDeckStore()
      store.addCard({ id: 'a', name: 'A', type: 'passive', rarity: 'common', effect: {}, cost: 20 })
      store.addCard({ id: 'b', name: 'B', type: 'utility', rarity: 'common', effect: {}, cost: 15 })
      expect(store.passiveCards).toHaveLength(1)
      expect(store.passiveCards[0].id).toBe('a')
    })

    it('utilityCards returns only utility-type cards', () => {
      const store = useDeckStore()
      store.addCard({ id: 'a', name: 'A', type: 'utility', rarity: 'common', effect: {}, cost: 15 })
      store.addCard({ id: 'b', name: 'B', type: 'action', rarity: 'common', effect: {}, cost: 20 })
      expect(store.utilityCards).toHaveLength(1)
      expect(store.utilityCards[0].id).toBe('a')
    })

    it('hasCard returns false on an empty deck', () => {
      const store = useDeckStore()
      expect(store.hasCard('card_action_teleport')).toBe(false)
    })
  })

  describe('reset', () => {
    it('empties the deck', () => {
      const store = useDeckStore()
      store.initWithArchetype('pirata', rngZero)
      store.reset()
      expect(store.cards).toHaveLength(0)
    })
  })
})
