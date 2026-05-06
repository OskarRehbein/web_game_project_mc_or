import { defineStore } from 'pinia'
import { ARCHETYPES } from '@/engine/entities/DeckArchetype.js'

export const useDeckStore = defineStore('deck', {
  state: () => ({
    /** @type {import('@/engine/entities/Card.js').Card[]} */
    cards: [],
  }),

  getters: {
    /**
     * @description Returns only cards of type 'action' — usable during combat (FR-007).
     * @returns {import('@/engine/entities/Card.js').Card[]}
     */
    actionCards: (state) => state.cards.filter((c) => c.type === 'action'),

    /**
     * @description Returns only cards of type 'passive' — auto-apply stat bonuses (FR-008).
     * @returns {import('@/engine/entities/Card.js').Card[]}
     */
    passiveCards: (state) => state.cards.filter((c) => c.type === 'passive'),

    /**
     * @description Returns only cards of type 'utility' — consumable in exploration events (FR-009).
     * @returns {import('@/engine/entities/Card.js').Card[]}
     */
    utilityCards: (state) => state.cards.filter((c) => c.type === 'utility'),

    /**
     * @description Checks whether at least one card with the given id exists in the deck.
     *              Used to determine if a locked decision option can be unlocked (FR-010).
     * @returns {(id: string) => boolean}
     */
    hasCard: (state) => (id) => state.cards.some((c) => c.id === id),
  },

  actions: {
    /**
     * @description Populates the deck with the starting cards of the chosen archetype (FR-012).
     *              Replaces any existing deck content.
     * @param {'action'|'balanced'|'exploration'} archetypeId - One of the three valid archetype ids
     * @returns {void}
     * @throws {Error} If `archetypeId` does not match any known archetype
     */
    initWithArchetype(archetypeId) {
      const archetype = ARCHETYPES[archetypeId]
      if (!archetype) {
        throw new Error(`Unknown archetype id: "${archetypeId}". Must be one of: ${Object.keys(ARCHETYPES).join(', ')}`)
      }
      this.cards = [...archetype.startingCards]
    },

    /**
     * @description Appends a card to the deck. Duplicates are allowed (FR-039).
     *              Called after combat rewards or shop purchases.
     * @param {import('@/engine/entities/Card.js').Card} card - Validated Card object to add
     * @returns {void}
     */
    addCard(card) {
      this.cards.push(card)
    },

    /**
     * @description Removes exactly ONE instance of the card with the given id.
     *              Used when a Utility card is consumed during an exploration event (FR-009).
     *              If the id is not found, the deck is unchanged and no error is thrown.
     * @param {string} id - The card id to remove (first match only)
     * @returns {void}
     */
    removeCard(id) {
      const index = this.cards.findIndex((c) => c.id === id)
      if (index !== -1) {
        this.cards.splice(index, 1)
      }
    },

    /**
     * @description Clears the entire deck. Called by gameStore.startNewRun() (FR-003).
     * @returns {void}
     */
    reset() {
      this.cards = []
    },
  },
})
