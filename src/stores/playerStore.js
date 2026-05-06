import { defineStore } from 'pinia'
import { Player } from '@/engine/entities/Player.js'

const _player = new Player()

export const usePlayerStore = defineStore('player', {
  state: () => ({
    hp: 100,
    maxHp: 100,
    gold: 0,
    /** @type {import('@/engine/entities/Debuff.js').Debuff[]} */
    activeDebuffs: [],
    _baseDamage: 10,
    _baseSpeed: 200,
  }),

  getters: {
    /**
     * Effective stats computed from passive cards + active debuffs.
     * Requires passive cards to be passed in from deckStore.
     * @returns {(passiveCards: import('@/engine/entities/Card.js').Card[]) => import('@/engine/entities/Player.js').PlayerStats}
     */
    stats: (state) => (passiveCards) => {
      _player.hp = state.hp
      _player.maxHp = state.maxHp
      _player.activeDebuffs = state.activeDebuffs
      _player._baseDamage = state._baseDamage
      _player._baseSpeed = state._baseSpeed
      return _player.computeStats(passiveCards ?? [])
    },

    isAlive: (state) => state.hp > 0,
    hasActiveDebuffs: (state) => state.activeDebuffs.length > 0,
  },

  actions: {
    /**
     * @description Reduces the player's current HP by `amount`, clamped to a minimum of 0.
     *              Used when a boss attack or hazard hits the player (FR-017, FR-004).
     * @param {number} amount - Damage points to subtract (positive integer)
     * @returns {void}
     */
    applyDamage(amount) {
      this.hp = Math.max(0, this.hp - amount)
    },

    /**
     * @description Restores HP by `amount`, clamped to a maximum of `maxHp`.
     *              Used by healing outcomes in events or card effects.
     * @param {number} amount - HP points to restore (positive integer)
     * @returns {void}
     */
    heal(amount) {
      this.hp = Math.min(this.maxHp, this.hp + amount)
    },

    /**
     * @description Adds gold to the player's total. Called after combat rewards or event outcomes (FR-029).
     * @param {number} amount - Gold coins to add (positive integer)
     * @returns {void}
     */
    addGold(amount) {
      this.gold += amount
    },

    /**
     * @description Deducts gold from the player's total for a shop purchase (SC-009).
     *              Enforces the economic invariant: player cannot spend more than they have.
     * @param {number} amount - Gold coins to spend (must be ≤ current gold)
     * @returns {void}
     * @throws {Error} If `this.gold < amount` (insufficient funds)
     */
    spendGold(amount) {
      if (this.gold < amount) {
        throw new Error(`Insufficient gold: have ${this.gold}, need ${amount}`)
      }
      this.gold -= amount
    },

    /**
     * @description Appends a debuff to the player's active debuff list.
     *              Debuffs are applied by sea events and persist until clearCombatDebuffs() is called (FR-036).
     * @param {import('@/engine/entities/Debuff.js').Debuff} debuff - Validated Debuff object
     * @returns {void}
     */
    addDebuff(debuff) {
      this.activeDebuffs.push(debuff)
    },

    /**
     * @description Removes all debuffs with `expireAfterCombat=true` from the active list.
     *              Called at the end of every combat encounter (FR-036).
     * @returns {void}
     */
    clearCombatDebuffs() {
      this.activeDebuffs = this.activeDebuffs.filter((d) => !d.expireAfterCombat)
    },

    /**
     * @description Resets all player state to initial values for a new run (FR-003).
     *              Called by gameStore.startNewRun() before navigating to deck selection.
     * @returns {void}
     */
    reset() {
      this.hp = 100
      this.maxHp = 100
      this.gold = 0
      this.activeDebuffs = []
      this._baseDamage = 10
      this._baseSpeed = 200
    },
  },
})
