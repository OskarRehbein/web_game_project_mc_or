import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '@/stores/gameStore.js'

describe('gameStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('startNewRun', () => {
    /**
     * @goal   Verify startNewRun resets currentPhase to 'menu'
     * @input  currentPhase mutated to 'combat', then startNewRun()
     * @expect currentPhase === 'menu'
     */
    it('resets currentPhase to menu', () => {
      const store = useGameStore()
      store.currentPhase = 'combat'
      store.startNewRun('pirata')
      expect(store.currentPhase).toBe('menu')
    })

    /**
     * @goal   Verify startNewRun stores the chosen archetype id
     * @input  startNewRun('navegante')
     * @expect chosenArchetype === 'navegante'
     */
    it('stores the chosen archetype id', () => {
      const store = useGameStore()
      store.startNewRun('navegante')
      expect(store.chosenArchetype).toBe('navegante')
    })

    /**
     * @goal   Verify startNewRun zeroes regularIslandsCompleted
     * @input  regularIslandsCompleted mutated to 5, then startNewRun()
     * @expect regularIslandsCompleted === 0
     */
    it('resets regularIslandsCompleted to 0', () => {
      const store = useGameStore()
      store.regularIslandsCompleted = 5
      store.startNewRun('pirata')
      expect(store.regularIslandsCompleted).toBe(0)
    })

    /**
     * @goal   Verify startNewRun clears bossIslandsDefeated array
     * @input  bossIslandsDefeated with one entry, then startNewRun()
     * @expect bossIslandsDefeated === []
     */
    it('clears bossIslandsDefeated', () => {
      const store = useGameStore()
      store.bossIslandsDefeated = [{ id: 'boss_1' }]
      store.startNewRun('pirata')
      expect(store.bossIslandsDefeated).toEqual([])
    })

    /**
     * @goal   Verify startNewRun clears any pending debuffs from a previous run
     * @input  pendingDebuffs with one entry, then startNewRun()
     * @expect pendingDebuffs === []
     */
    it('clears pendingDebuffs', () => {
      const store = useGameStore()
      store.pendingDebuffs = [{ type: 'damage', magnitude: 0.2, expireAfterCombat: true }]
      store.startNewRun('pirata')
      expect(store.pendingDebuffs).toEqual([])
    })
  })

  describe('enterCombat', () => {
    /**
     * @goal   Verify enterCombat sets currentPhase to 'combat'
     * @input  enterCombat({ id: 'b1', hp: 200, maxHp: 200, ... })
     * @expect currentPhase === 'combat'
     */
    it('sets currentPhase to combat', () => {
      const store = useGameStore()
      store.enterCombat({ id: 'b1', hp: 200, maxHp: 200, attackPatterns: [], lootPool: [], isMajor: false })
      expect(store.currentPhase).toBe('combat')
    })

    /**
     * @goal   Verify enterCombat stores the boss and syncs bossHp/bossMaxHp
     * @input  boss with hp=150, maxHp=200
     * @expect currentBoss is set, bossHp===150, bossMaxHp===200
     */
    it('stores the boss and syncs hp values', () => {
      const store = useGameStore()
      const boss = { id: 'b1', hp: 150, maxHp: 200, attackPatterns: [], lootPool: [], isMajor: false }
      store.enterCombat(boss)
      expect(store.currentBoss).toEqual(boss)
      expect(store.bossHp).toBe(150)
      expect(store.bossMaxHp).toBe(200)
    })
  })

  describe('resolveCombatVictory', () => {
    /**
     * @goal   Verify victory against a minor boss increments regularIslandsCompleted
     * @input  currentBoss.isMajor=false, resolveCombatVictory(rewards)
     * @expect regularIslandsCompleted === 1
     */
    it('increments regularIslandsCompleted for minor boss', () => {
      const store = useGameStore()
      store.currentBoss = { id: 'b1', isMajor: false }
      store.resolveCombatVictory({ gold: 10, cards: [] })
      expect(store.regularIslandsCompleted).toBe(1)
    })

    /**
     * @goal   Verify victory against a major boss adds boss to bossIslandsDefeated
     * @input  currentBoss.isMajor=true, id='boss_kraken', resolveCombatVictory(rewards)
     * @expect bossIslandsDefeated contains the boss id
     */
    it('adds major boss id to bossIslandsDefeated', () => {
      const store = useGameStore()
      store.currentBoss = { id: 'boss_kraken', isMajor: true }
      store.resolveCombatVictory({ gold: 40, cards: [] })
      expect(store.bossIslandsDefeated).toContain('boss_kraken')
    })

    /**
     * @goal   Verify victory sets currentPhase to 'reward'
     * @input  resolveCombatVictory(rewards)
     * @expect currentPhase === 'reward'
     */
    it('sets currentPhase to reward', () => {
      const store = useGameStore()
      store.currentBoss = { id: 'b1', isMajor: false }
      store.resolveCombatVictory({ gold: 10, cards: [] })
      expect(store.currentPhase).toBe('reward')
    })

    /**
     * @goal   Verify victory stores rewards in pendingRewards
     * @input  rewards = { gold: 15, cards: ['card_1'] }
     * @expect pendingRewards deep-equals the rewards object
     */
    it('stores rewards in pendingRewards', () => {
      const store = useGameStore()
      store.currentBoss = { id: 'b1', isMajor: false }
      const rewards = { gold: 15, cards: ['card_1'] }
      store.resolveCombatVictory(rewards)
      expect(store.pendingRewards).toEqual(rewards)
    })
  })

  describe('resolveGameOver', () => {
    /**
     * @goal   Verify resolveGameOver sets currentPhase back to 'menu'
     * @input  currentPhase === 'combat', resolveGameOver()
     * @expect currentPhase === 'menu'
     */
    it('sets currentPhase to menu', () => {
      const store = useGameStore()
      store.currentPhase = 'combat'
      store.resolveGameOver()
      expect(store.currentPhase).toBe('menu')
    })
  })

  describe('setCurrentEvent', () => {
    /**
     * @goal   Verify setCurrentEvent stores an event in currentEvent
     * @input  setCurrentEvent({ id: 'evt_1', title: 'Storm' })
     * @expect currentEvent.id === 'evt_1'
     */
    it('stores the event in currentEvent', () => {
      const store = useGameStore()
      store.setCurrentEvent({ id: 'evt_1', title: 'Storm' })
      expect(store.currentEvent).toMatchObject({ id: 'evt_1' })
    })

    /**
     * @goal   Verify setCurrentEvent with null clears the current event (closes modal)
     * @input  setCurrentEvent(null)
     * @expect currentEvent === null
     */
    it('clears currentEvent when called with null', () => {
      const store = useGameStore()
      store.currentEvent = { id: 'evt_1' }
      store.setCurrentEvent(null)
      expect(store.currentEvent).toBeNull()
    })
  })

  describe('isBossGate getter', () => {
    /**
     * @goal   Verify isBossGate is true after exactly 5 regular islands (FR-031)
     * @input  regularIslandsCompleted = 5
     * @expect isBossGate === true
     */
    it('is true when regularIslandsCompleted === 5', () => {
      const store = useGameStore()
      store.regularIslandsCompleted = 5
      expect(store.isBossGate).toBe(true)
    })

    /**
     * @goal   Verify isBossGate is false before reaching the gate threshold
     * @input  regularIslandsCompleted = 3
     * @expect isBossGate === false
     */
    it('is false when regularIslandsCompleted === 3', () => {
      const store = useGameStore()
      store.regularIslandsCompleted = 3
      expect(store.isBossGate).toBe(false)
    })

    /**
     * @goal   Verify isBossGate is false at the start of a run
     * @input  regularIslandsCompleted = 0 (default)
     * @expect isBossGate === false
     */
    it('is false at the start of a run', () => {
      const store = useGameStore()
      expect(store.isBossGate).toBe(false)
    })
  })

  describe('isFinalGate getter', () => {
    /**
     * @goal   Verify isFinalGate is true when all 3 boss islands are defeated (FR-033)
     * @input  bossIslandsDefeated with 3 entries
     * @expect isFinalGate === true
     */
    it('is true when 3 boss islands are defeated', () => {
      const store = useGameStore()
      store.bossIslandsDefeated = ['boss_1', 'boss_2', 'boss_3']
      expect(store.isFinalGate).toBe(true)
    })

    /**
     * @goal   Verify isFinalGate is false when fewer than 3 boss islands are defeated
     * @input  bossIslandsDefeated with 2 entries
     * @expect isFinalGate === false
     */
    it('is false when only 2 boss islands are defeated', () => {
      const store = useGameStore()
      store.bossIslandsDefeated = ['boss_1', 'boss_2']
      expect(store.isFinalGate).toBe(false)
    })
  })
})
