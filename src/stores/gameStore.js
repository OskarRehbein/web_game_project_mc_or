import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    /** @type {'menu'|'exploration'|'combat'|'reward'|'gameover'|'victory'} */
    currentPhase: 'menu',
    /** @type {import('@/engine/entities/Boss.js').Boss|null} */
    currentBoss: null,
    /** @type {object|null} */
    currentIsland: null,
    /** @type {object|null} */
    currentEvent: null,
    bossHp: 0,
    bossMaxHp: 0,
    regularIslandsCompleted: 0,
    /** @type {string[]} ids of defeated major bosses */
    bossIslandsDefeated: [],
    /** @type {import('@/engine/entities/Debuff.js').Debuff[]} */
    pendingDebuffs: [],
    /** @type {object|null} */
    pendingRewards: null,
    /** @type {string|null} */
    chosenArchetype: null,
  }),

  getters: {
    /**
     * @description True when the player has completed 5 regular islands and must
     *              choose a boss island next (FR-031). Triggers after every 5th island.
     * @returns {boolean}
     */
    isBossGate: (state) => state.regularIslandsCompleted > 0 && state.regularIslandsCompleted % 5 === 0,

    /**
     * @description True when 3 or more major bosses have been defeated, meaning
     *              only Fathom's End remains available (FR-033).
     * @returns {boolean}
     */
    isFinalGate: (state) => state.bossIslandsDefeated.length >= 3,
  },

  actions: {
    /**
     * @description Resets all run state and records the chosen archetype.
     *              Called at the start of every new run before navigating to deck selection (FR-003).
     * @param {string} archetypeId - The id of the chosen deck archetype
     * @returns {void}
     */
    startNewRun(archetypeId) {
      this.currentPhase = 'menu'
      this.currentBoss = null
      this.currentIsland = null
      this.currentEvent = null
      this.bossHp = 0
      this.bossMaxHp = 0
      this.regularIslandsCompleted = 0
      this.bossIslandsDefeated = []
      this.pendingDebuffs = []
      this.pendingRewards = null
      this.chosenArchetype = archetypeId ?? null
    },

    /**
     * @description Loads a boss and transitions the game to combat phase (FR-001).
     *              Syncs bossHp and bossMaxHp for HUD reactivity.
     * @param {import('@/engine/entities/Boss.js').Boss} boss - The boss to fight
     * @returns {void}
     */
    enterCombat(boss) {
      this.currentBoss = boss
      this.bossHp = boss?.hp ?? 0
      this.bossMaxHp = boss?.maxHp ?? 0
      this.currentPhase = 'combat'
    },

    /**
     * @description Resolves a combat victory: increments progression counters
     *              based on boss type, stores rewards, and transitions to reward phase (FR-022).
     *              Major boss ids are tracked to prevent re-selection (FR-032).
     * @param {{ gold: number, cards: object[] }} rewards - Loot earned from the defeated boss
     * @returns {void}
     */
    resolveCombatVictory(rewards) {
      if (this.currentBoss?.isMajor) {
        this.bossIslandsDefeated.push(this.currentBoss.id)
      } else {
        this.regularIslandsCompleted += 1
      }
      this.pendingRewards = rewards
      this.currentPhase = 'reward'
    },

    /**
     * @description Handles player defeat. Transitions to menu phase (FR-004).
     *              The UI layer is responsible for showing the Game Over screen.
     * @returns {void}
     */
    resolveGameOver() {
      this.currentPhase = 'menu'
    },

    /**
     * @description Sets or clears the active event displayed in EventModal.
     *              Pass null to close the modal and clear the event state (FR-025).
     * @param {object|null} event - The event object to display, or null to clear
     * @returns {void}
     */
    setCurrentEvent(event) {
      this.currentEvent = event
    },

    /**
     * @description Stores a pending debuff applied by a sea event, to be transferred
     *              to playerStore before the next combat begins (FR-036).
     * @param {import('@/engine/entities/Debuff.js').Debuff} debuff - The debuff to queue
     * @returns {void}
     */
    addPendingDebuff(debuff) {
      this.pendingDebuffs.push(debuff)
    },

    /**
     * @description Clears all pending debuffs after they have been applied to playerStore.
     *              Called during the transition from exploration to combat.
     * @returns {void}
     */
    flushPendingDebuffs() {
      this.pendingDebuffs = []
    },
  },
})

