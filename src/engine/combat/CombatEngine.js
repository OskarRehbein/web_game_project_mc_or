/**
 * CombatEngine — PixiJS v8 game loop for boss combat encounters.
 *
 * This module is the ONLY file in src/engine/ that imports PixiJS,
 * because it specifically renders the combat canvas (FR-013, FR-044).
 * All pure logic (damage, patterns, collision) is handled by the
 * sibling modules and injected as dependencies.
 *
 * Arena dimensions: 960 × 540 px (16:9 at half-HD, FR-013).
 *
 * Lifecycle:
 *   1. createCombatApp(options) → initialises PIXI.Application and returns controller
 *   2. controller.start()      → begins the game loop
 *   3. controller.destroy()    → cleans up PIXI resources on Vue unmount (FR-044)
 */

import { Application, Graphics, Text, TextStyle, Ticker } from 'pixi.js'
import { getEligiblePatterns, pickPattern } from './AttackPatternSelector.js'
import { getCollisions } from './CollisionSystem.js'
import { calculateDamage } from './DamageCalculator.js'

const ARENA_WIDTH = 960
const ARENA_HEIGHT = 540

/** Placeholder colours for entities (replaced by sprites in Week 4) */
const COLORS = {
  platform: 0x4a3728,
  player: 0x44aaff,
  boss: 0xcc3333,
  telegraph: 0xffaa00,
  danger: 0xff2200,
  background: 0x0d1b2a,
}

/** Player movement speed in px/s */
const PLAYER_BASE_SPEED = 200

/** Player hitbox size in px */
const PLAYER_W = 32
const PLAYER_H = 48

/** Boss sprite size in px */
const BOSS_W = 120
const BOSS_H = 120

/**
 * @typedef {Object} CombatOptions
 * @property {HTMLElement}             container       - DOM element to attach the canvas to
 * @property {Object}                  boss            - Boss data from bosses.json
 * @property {import('../entities/Card.js').Card[]} passiveCards - Player's passive cards for damage calc
 * @property {import('../entities/Debuff.js').Debuff[]} debuffs  - Active debuffs on the player
 * @property {(damage: number) => void} onPlayerHit    - Called when a hazard zone hits the player
 * @property {() => void}              onBossDefeated  - Called when boss HP reaches 0
 * @property {() => void}              onPlayerDefeated - Called when caller decides game over
 * @property {(hp: number) => void}    onBossHpChanged - Called every time boss takes damage
 */

/**
 * @typedef {Object} CombatController
 * @property {() => void} start   - Begins the game loop
 * @property {() => void} destroy - Cleans up all PIXI resources
 * @property {(damage: number) => void} dealDamageToBoss - Apply damage to boss from Vue layer
 */

/**
 * @description Creates and initialises a PixiJS v8 combat application.
 *              Sets up: background, platforms, player sprite, boss sprite,
 *              telegraph zones, game loop with AABB collision detection,
 *              keyboard input handling and a clean destroy path for Vue unmount (FR-044).
 *
 *              The function is async because PIXI.Application.init() is async in v8.
 *
 * @param {CombatOptions} options - Configuration and callback hooks
 * @returns {Promise<CombatController>} Controller object with start() and destroy()
 * @throws {Error} If `options.container` is not a valid HTMLElement
 */
export async function createCombatApp(options) {
  const {
    container,
    boss,
    passiveCards = [],
    debuffs = [],
    onPlayerHit,
    onBossDefeated,
    onPlayerDefeated,
    onBossHpChanged,
  } = options

  if (!(container instanceof HTMLElement)) {
    throw new Error('createCombatApp: container must be a valid HTMLElement')
  }

  // ─── PixiJS Application ────────────────────────────────────────────────────
  const app = new Application()
  await app.init({
    width: ARENA_WIDTH,
    height: ARENA_HEIGHT,
    backgroundColor: COLORS.background,
    antialias: false,
    resolution: 1,
  })
  container.appendChild(app.canvas)

  // ─── State ─────────────────────────────────────────────────────────────────
  const state = {
    bossHp: boss.maxHp,
    bossMaxHp: boss.maxHp,
    playerX: 120,
    playerY: ARENA_HEIGHT - 100 - PLAYER_H,
    keys: {},
    activeZones: [],   // current danger zones shown on screen
    telegraphTimer: 0, // ms until next attack fires
    currentPattern: null,
    telegraphActive: false,
    isDestroyed: false,
  }

  // ─── Platforms ─────────────────────────────────────────────────────────────
  const platforms = [
    { x: 0, y: ARENA_HEIGHT - 40, width: ARENA_WIDTH, height: 40 },  // floor
    { x: 200, y: 350, width: 200, height: 20 },  // left platform
    { x: 560, y: 350, width: 200, height: 20 },  // right platform
    { x: 380, y: 240, width: 200, height: 20 },  // center platform
  ]

  // ─── Graphics containers ────────────────────────────────────────────────────
  const bgGfx = new Graphics()
  const platformGfx = new Graphics()
  const telegraphGfx = new Graphics()
  const playerGfx = new Graphics()
  const bossGfx = new Graphics()
  const bossHpBarBg = new Graphics()
  const bossHpBarFill = new Graphics()

  app.stage.addChild(bgGfx, platformGfx, telegraphGfx, bossGfx, playerGfx, bossHpBarBg, bossHpBarFill)

  // ─── Draw static elements ──────────────────────────────────────────────────
  bgGfx.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT).fill(COLORS.background)

  for (const p of platforms) {
    platformGfx.rect(p.x, p.y, p.width, p.height).fill(COLORS.platform)
  }

  // Boss placeholder (top-center)
  const bossX = ARENA_WIDTH / 2 - BOSS_W / 2
  const bossY = 80
  bossGfx.rect(bossX, bossY, BOSS_W, BOSS_H).fill(COLORS.boss)

  // Boss HP bar background
  bossHpBarBg.rect(20, 12, ARENA_WIDTH - 40, 16).fill(0x333333)

  // ─── Boss HP bar update helper ─────────────────────────────────────────────
  function redrawBossHpBar() {
    bossHpBarFill.clear()
    const ratio = Math.max(0, state.bossHp / state.bossMaxHp)
    bossHpBarFill.rect(20, 12, (ARENA_WIDTH - 40) * ratio, 16).fill(0xee3333)
  }
  redrawBossHpBar()

  // ─── Keyboard input ────────────────────────────────────────────────────────
  function onKeyDown(e) { state.keys[e.code] = true }
  function onKeyUp(e) { state.keys[e.code] = false }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  // ─── Telegraph helpers ─────────────────────────────────────────────────────
  function beginTelegraph() {
    const eligible = getEligiblePatterns(boss.attackPatterns, state.bossHp, state.bossMaxHp)
    if (eligible.length === 0) return

    state.currentPattern = pickPattern(eligible, Math.random)
    state.activeZones = state.currentPattern.zones ?? []
    state.telegraphTimer = state.currentPattern.telegraphDurationMs
    state.telegraphActive = true

    telegraphGfx.clear()
    for (const z of state.activeZones) {
      telegraphGfx.rect(z.x, z.y, z.width, z.height).fill({ color: COLORS.telegraph, alpha: 0.4 })
    }
  }

  function fireAttack() {
    state.telegraphActive = false
    telegraphGfx.clear()

    // Draw danger flash
    for (const z of state.activeZones) {
      telegraphGfx.rect(z.x, z.y, z.width, z.height).fill({ color: COLORS.danger, alpha: 0.8 })
    }

    // Check player collision
    const playerRect = { x: state.playerX, y: state.playerY, width: PLAYER_W, height: PLAYER_H }
    const hits = getCollisions(playerRect, state.activeZones)
    if (hits.length > 0) {
      onPlayerHit?.(state.currentPattern.damage ?? 10)
    }

    // Clear danger after 300 ms
    setTimeout(() => {
      if (!state.isDestroyed) telegraphGfx.clear()
    }, 300)

    state.activeZones = []
    state.currentPattern = null
  }

  // Interval between attack patterns (ms)
  const PATTERN_INTERVAL = 3000
  let timeSinceLastAttack = PATTERN_INTERVAL // trigger first attack quickly

  // ─── Game loop ─────────────────────────────────────────────────────────────
  function gameLoop(ticker) {
    if (state.isDestroyed) return
    const dt = ticker.deltaMS  // milliseconds since last frame

    // Player movement
    const speed = PLAYER_BASE_SPEED * (dt / 1000)
    if (state.keys['ArrowLeft'] || state.keys['KeyA']) state.playerX -= speed
    if (state.keys['ArrowRight'] || state.keys['KeyD']) state.playerX += speed
    if (state.keys['ArrowUp'] || state.keys['KeyW']) state.playerY -= speed
    if (state.keys['ArrowDown'] || state.keys['KeyS']) state.playerY += speed

    // Clamp player inside arena
    state.playerX = Math.max(0, Math.min(ARENA_WIDTH - PLAYER_W, state.playerX))
    state.playerY = Math.max(0, Math.min(ARENA_HEIGHT - PLAYER_H, state.playerY))

    // Redraw player
    playerGfx.clear()
    playerGfx.rect(state.playerX, state.playerY, PLAYER_W, PLAYER_H).fill(COLORS.player)

    // Telegraph / attack cycle
    if (state.telegraphActive) {
      state.telegraphTimer -= dt
      if (state.telegraphTimer <= 0) {
        fireAttack()
        timeSinceLastAttack = 0
      }
    } else {
      timeSinceLastAttack += dt
      if (timeSinceLastAttack >= PATTERN_INTERVAL) {
        beginTelegraph()
      }
    }
  }

  // ─── Controller ────────────────────────────────────────────────────────────
  const controller = {
    /**
     * @description Starts the PixiJS ticker (game loop). Must be called after the
     *              component is mounted to ensure the canvas is in the DOM.
     * @returns {void}
     */
    start() {
      app.ticker.add(gameLoop)
    },

    /**
     * @description Applies damage to the boss, updates the HP bar, and fires
     *              onBossDefeated() if HP reaches 0. Called from CombatView when
     *              the player activates an Action card.
     * @param {number} damage - Damage amount to subtract from boss HP (≥ 0)
     * @returns {void}
     */
    dealDamageToBoss(damage) {
      if (state.isDestroyed || state.bossHp <= 0) return
      const finalDamage = calculateDamage(damage, passiveCards, debuffs)
      state.bossHp = Math.max(0, state.bossHp - finalDamage)
      onBossHpChanged?.(state.bossHp)
      redrawBossHpBar()
      if (state.bossHp === 0) {
        onBossDefeated?.()
      }
    },

    /**
     * @description Destroys the PixiJS application and removes all event listeners.
     *              Must be called in Vue's onUnmounted() hook to prevent memory leaks (FR-044).
     * @returns {void}
     */
    destroy() {
      if (state.isDestroyed) return
      state.isDestroyed = true
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      app.ticker.remove(gameLoop)
      app.destroy(true, { children: true })
    },
  }

  return controller
}
