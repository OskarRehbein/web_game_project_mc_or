import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDeckStore } from '@/stores/deckStore.js'
import { ARCHETYPES } from '@/engine/entities/DeckArchetype.js'

describe('deckStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initWithArchetype', () => {
    /**
     * @goal   Verify the 'action' archetype loads exactly 3 Action cards
     * @input  initWithArchetype('action')
     * @expect cards.length === 3, all cards have type === 'action'
     */
    it('action archetype produces 3 action cards', () => {
      const store = useDeckStore()
      store.initWithArchetype('action')
      expect(store.cards).toHaveLength(3)
      expect(store.cards.every((c) => c.type === 'action')).toBe(true)
    })

    /**
     * @goal   Verify the 'balanced' archetype loads 1 Action, 1 Passive, 1 Utility (FR-012)
     * @input  initWithArchetype('balanced')
     * @expect actionCards.length===1, passiveCards.length===1, utilityCards.length===1
     */
    it('balanced archetype produces 1 action, 1 passive, 1 utility', () => {
      const store = useDeckStore()
      store.initWithArchetype('balanced')
      expect(store.actionCards).toHaveLength(1)
      expect(store.passiveCards).toHaveLength(1)
      expect(store.utilityCards).toHaveLength(1)
    })

    /**
     * @goal   Verify the 'exploration' archetype loads 1 Action, 1 Passive, 2 Utility (FR-012)
     * @input  initWithArchetype('exploration')
     * @expect actionCards.length===1, passiveCards.length===1, utilityCards.length===2
     */
    it('exploration archetype produces 1 action, 1 passive, 2 utility', () => {
      const store = useDeckStore()
      store.initWithArchetype('exploration')
      expect(store.actionCards).toHaveLength(1)
      expect(store.passiveCards).toHaveLength(1)
      expect(store.utilityCards).toHaveLength(2)
    })

    /**
     * @goal   Verify the loaded cards match the exact cards defined in ARCHETYPES
     * @input  initWithArchetype('action'), compare to ARCHETYPES.action.startingCards
     * @expect store.cards deep-equals ARCHETYPES.action.startingCards
     */
    it('cards match the archetype startingCards definition', () => {
      const store = useDeckStore()
      store.initWithArchetype('action')
      expect(store.cards).toEqual(ARCHETYPES.action.startingCards)
    })

    /**
     * @goal   Verify initWithArchetype throws on an unknown archetype id
     * @input  initWithArchetype('invalid')
     * @expect throws Error
     */
    it('throws when given an unknown archetype id', () => {
      const store = useDeckStore()
      expect(() => store.initWithArchetype('invalid')).toThrow()
    })
  })

  describe('addCard', () => {
    /**
     * @goal   Verify addCard increases the deck length by 1
     * @input  Empty deck, addCard with a valid card object
     * @expect cards.length === 1
     */
    it('increases cards.length by 1', () => {
      const store = useDeckStore()
      store.addCard({ id: 'slash', name: 'Slash', type: 'action', rarity: 'common', effect: {}, cost: 15 })
      expect(store.cards).toHaveLength(1)
    })

    /**
     * @goal   Verify the added card is present in the deck
     * @input  addCard with a card having id 'slash'
     * @expect hasCard('slash') === true
     */
    it('the added card is retrievable via hasCard', () => {
      const store = useDeckStore()
      store.addCard({ id: 'slash', name: 'Slash', type: 'action', rarity: 'common', effect: {}, cost: 15 })
      expect(store.hasCard('slash')).toBe(true)
    })

    /**
     * @goal   Verify multiple copies of the same card can be added (no dedup)
     * @input  addCard called twice with the same card id
     * @expect cards.length === 2
     */
    it('allows duplicate card entries', () => {
      const store = useDeckStore()
      const card = { id: 'slash', name: 'Slash', type: 'action', rarity: 'common', effect: {}, cost: 15 }
      store.addCard(card)
      store.addCard(card)
      expect(store.cards).toHaveLength(2)
    })
  })

  describe('removeCard', () => {
    /**
     * @goal   Verify removeCard removes exactly ONE instance of a utility card (FR-009)
     * @input  Two copies of a utility card, removeCard called once
     * @expect cards.length === 1 (one copy remains)
     */
    it('removes only one instance of a utility card', () => {
      const store = useDeckStore()
      const card = { id: 'nav_chart', name: "Navigator's Chart", type: 'utility', rarity: 'common', effect: {}, cost: 15 }
      store.addCard(card)
      store.addCard(card)
      store.removeCard('nav_chart')
      expect(store.cards).toHaveLength(1)
    })

    /**
     * @goal   Verify removeCard on a card id not in deck does not crash and deck is unchanged
     * @input  Empty deck, removeCard('nonexistent')
     * @expect cards.length === 0, no error thrown
     */
    it('does nothing when card id is not found', () => {
      const store = useDeckStore()
      expect(() => store.removeCard('nonexistent')).not.toThrow()
      expect(store.cards).toHaveLength(0)
    })
  })

  describe('getters', () => {
    /**
     * @goal   Verify actionCards getter filters only action-type cards
     * @input  One action card and one passive card
     * @expect actionCards.length === 1
     */
    it('actionCards returns only action-type cards', () => {
      const store = useDeckStore()
      store.addCard({ id: 'slash', name: 'Slash', type: 'action', rarity: 'common', effect: {}, cost: 15 })
      store.addCard({ id: 'iron', name: 'Iron Skin', type: 'passive', rarity: 'common', effect: {}, cost: 20 })
      expect(store.actionCards).toHaveLength(1)
      expect(store.actionCards[0].id).toBe('slash')
    })

    /**
     * @goal   Verify passiveCards getter filters only passive-type cards
     * @input  One passive card and one utility card
     * @expect passiveCards.length === 1
     */
    it('passiveCards returns only passive-type cards', () => {
      const store = useDeckStore()
      store.addCard({ id: 'iron', name: 'Iron Skin', type: 'passive', rarity: 'common', effect: {}, cost: 20 })
      store.addCard({ id: 'nav', name: 'Nav Chart', type: 'utility', rarity: 'common', effect: {}, cost: 15 })
      expect(store.passiveCards).toHaveLength(1)
      expect(store.passiveCards[0].id).toBe('iron')
    })

    /**
     * @goal   Verify utilityCards getter filters only utility-type cards
     * @input  One utility card and one action card
     * @expect utilityCards.length === 1
     */
    it('utilityCards returns only utility-type cards', () => {
      const store = useDeckStore()
      store.addCard({ id: 'nav', name: 'Nav Chart', type: 'utility', rarity: 'common', effect: {}, cost: 15 })
      store.addCard({ id: 'slash', name: 'Slash', type: 'action', rarity: 'common', effect: {}, cost: 15 })
      expect(store.utilityCards).toHaveLength(1)
      expect(store.utilityCards[0].id).toBe('nav')
    })

    /**
     * @goal   Verify hasCard returns false when deck is empty
     * @input  Empty deck, hasCard('slash')
     * @expect false
     */
    it('hasCard returns false on an empty deck', () => {
      const store = useDeckStore()
      expect(store.hasCard('slash')).toBe(false)
    })
  })

  describe('reset', () => {
    /**
     * @goal   Verify reset empties the deck regardless of prior state
     * @input  Deck initialized with 'action' archetype, then reset()
     * @expect cards.length === 0
     */
    it('empties the deck', () => {
      const store = useDeckStore()
      store.initWithArchetype('action')
      store.reset()
      expect(store.cards).toHaveLength(0)
    })
  })
})
