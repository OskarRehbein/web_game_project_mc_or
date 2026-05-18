import { defineStore } from 'pinia'
import { ARCHETYPES, buildDeck } from '@/engine/entities/DeckArchetype.js'

export const useDeckStore = defineStore('deck', {
  state: () => ({
    /** @type {import('@/engine/entities/Card.js').Card[]} */
    cards: [],
  }),

  getters: {
    /**
     * @description Cartas de tipo 'action' — activables durante combate (FR-007).
     * @returns {import('@/engine/entities/Card.js').Card[]}
     */
    actionCards: (state) => state.cards.filter((c) => c.type === 'action'),

    /**
     * @description Cartas de tipo 'passive' — aplican modificadores automáticos (FR-008).
     * @returns {import('@/engine/entities/Card.js').Card[]}
     */
    passiveCards: (state) => state.cards.filter((c) => c.type === 'passive'),

    /**
     * @description Cartas de tipo 'utility' — consumibles en exploración (FR-009).
     * @returns {import('@/engine/entities/Card.js').Card[]}
     */
    utilityCards: (state) => state.cards.filter((c) => c.type === 'utility'),

    /**
     * @description Indica si existe al menos una carta con el id dado en el mazo.
     *              Usado para desbloquear opciones de decisión (FR-010).
     * @returns {(id: string) => boolean}
     */
    hasCard: (state) => (id) => state.cards.some((c) => c.id === id),
  },

  actions: {
    /**
     * @description Inicializa el mazo con las cartas del arquetipo elegido,
     *              seleccionando aleatoriamente del pool según la composición
     *              del arquetipo (FR-012 actualizado). Reemplaza el contenido previo.
     * @param {'pirata'|'navegante'} archetypeId - Id del arquetipo elegido
     * @param {() => number}         [rng=Math.random] - RNG inyectable para tests
     * @returns {void}
     * @throws {Error} Si `archetypeId` no coincide con un arquetipo conocido
     */
    initWithArchetype(archetypeId, rng = Math.random) {
      if (!ARCHETYPES[archetypeId]) {
        throw new Error(
          `Unknown archetype id: "${archetypeId}". Must be one of: ${Object.keys(ARCHETYPES).join(', ')}`,
        )
      }
      this.cards = buildDeck(archetypeId, rng)
    },

    /**
     * @description Añade una carta al mazo. Se permiten duplicados (FR-039).
     * @param {import('@/engine/entities/Card.js').Card} card
     * @returns {void}
     */
    addCard(card) {
      this.cards.push(card)
    },

    /**
     * @description Elimina exactamente una instancia con el id dado.
     *              Usado al consumir una carta de Utilidad (FR-009).
     *              Si el id no existe el mazo queda intacto sin lanzar error.
     * @param {string} id
     * @returns {void}
     */
    removeCard(id) {
      const index = this.cards.findIndex((c) => c.id === id)
      if (index !== -1) {
        this.cards.splice(index, 1)
      }
    },

    /**
     * @description Vacía el mazo. Llamado por gameStore.startNewRun() (FR-003).
     * @returns {void}
     */
    reset() {
      this.cards = []
    },
  },
})
