import { defineStore } from 'pinia'

/**
 * gameStore — Phase 2 stub.
 * Full implementation in T016.
 */
export const useGameStore = defineStore('game', {
  state: () => ({
    currentPhase: 'menu',
    currentIsland: null,
    currentBoss: null,
    bossHp: 0,
    bossMaxHp: 0,
    regularIslandsCompleted: 0,
    bossIslandsDefeated: [],
    pendingDebuffs: [],
    pendingRewards: null,
    chosenArchetype: null,
  }),
  getters: {
    isBossGate: (state) => state.regularIslandsCompleted > 0 && state.regularIslandsCompleted % 3 === 0,
    isFinalGate: (state) => state.bossIslandsDefeated.length >= 3,
  },
  actions: {
    startNewRun() {
      this.$reset()
    },
    enterCombat(boss) {
      this.currentBoss = boss
      this.bossHp = boss?.hp ?? 0
      this.bossMaxHp = boss?.maxHp ?? 0
      this.currentPhase = 'combat'
    },
    resolveCombatVictory(rewards) {
      this.pendingRewards = rewards
      this.currentPhase = 'reward'
    },
    resolveGameOver() {
      this.currentPhase = 'menu'
    },
  },
})
