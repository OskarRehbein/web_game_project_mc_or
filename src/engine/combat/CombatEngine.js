/**
 * CombatEngine — Motor de combate PixiJS v8 para encuentros con jefes.
 *
 * Este módulo es el ÚNICO archivo en src/engine/ que importa PixiJS, porque
 * renderiza específicamente el lienzo de combate (FR-013, FR-044). Toda la
 * lógica pura (daño, patrones, colisión) vive en módulos hermanos y se inyecta
 * como dependencia.
 *
 * Estilo de arena (FR-018): arcade bossfight 2D sin plataformas. El jugador
 * se mueve libremente por la arena con WASD/flechas; el jefe es parte del
 * escenario y solo recibe daño por cartas de Acción o el ataque básico
 * (FR-020a, FR-020b) — click derecho.
 *
 * Dimensiones lógicas: 960 × 540 px (16:9). El escalado responsive lo gestiona
 * CombatView.vue vía CSS transform; el motor siempre trabaja en estas
 * coordenadas internas.
 *
 * Ciclo de vida:
 *   1. createCombatApp(options) → inicializa PIXI.Application y devuelve el controlador
 *   2. controller.start()      → arranca el game loop
 *   3. controller.destroy()    → limpia recursos PIXI cuando el componente Vue se desmonta (FR-044)
 */

import { Application, Graphics } from 'pixi.js'
import { getEligiblePatterns, pickPattern } from './AttackPatternSelector.js'
import { getCollisions } from './CollisionSystem.js'
import { calculateDamage } from './DamageCalculator.js'

const ARENA_WIDTH = 960
const ARENA_HEIGHT = 540

/** Paleta visual de la arena */
const COLORS = {
  bgTop: 0x0a1a2e,
  bgBottom: 0x162447,
  arenaFloor: 0x1f4068,
  arenaEdge: 0xe94560,
  arenaEdgeAlt: 0x533483,
  player: 0x4ad8e0,
  playerGlow: 0x88f0ff,
  boss: 0xc73e3a,
  bossGlow: 0xff7a6b,
  bossEye: 0xffe066,
  telegraph: 0xffaa00,
  danger: 0xff2200,
  basicSwing: 0xffffff,
}

/** Velocidad de movimiento del jugador en px/s */
const PLAYER_BASE_SPEED = 240

/** Tamaño del hitbox del jugador en px */
const PLAYER_W = 36
const PLAYER_H = 36

/** Tamaño del jefe en px */
const BOSS_W = 160
const BOSS_H = 140

/** Daño base del ataque básico (FR-020b) */
const BASIC_ATTACK_BASE_DAMAGE = 10

/** Cooldown mínimo del ataque básico para evitar spam (ms) */
const BASIC_ATTACK_COOLDOWN_MS = 400

/** Duración de la animación visual del swing del ataque básico (ms) */
const BASIC_SWING_DURATION_MS = 180

/**
 * @typedef {Object} CombatOptions
 * @property {HTMLElement}              container        - Elemento DOM al que se adjunta el canvas
 * @property {Object}                   boss             - Datos del jefe desde bosses.json
 * @property {import('../entities/Card.js').Card[]} passiveCards - Cartas Pasivas del jugador para cálculo de daño
 * @property {import('../entities/Debuff.js').Debuff[]} debuffs   - Debuffs activos sobre el jugador
 * @property {(damage: number) => void} onPlayerHit      - Se llama cuando una zona peligrosa golpea al jugador
 * @property {() => void}               onBossDefeated   - Se llama cuando el HP del jefe llega a 0
 * @property {(hp: number) => void}     onBossHpChanged  - Se llama cada vez que el jefe recibe daño
 */

/**
 * @typedef {Object} CombatController
 * @property {() => void} start    - Arranca el game loop
 * @property {() => void} destroy  - Limpia todos los recursos de PIXI
 * @property {(damage: number) => void} dealDamageToBoss - Aplica daño al jefe desde la capa Vue
 */

/**
 * @description Crea e inicializa la aplicación de combate PixiJS v8 (estilo arena).
 *              Configura: fondo con gradiente, suelo de arena, sprite del jugador y del jefe,
 *              zonas de telegrafiado, game loop con detección de colisiones AABB, manejo de
 *              entrada por teclado (movimiento) y mouse (ataque básico con click derecho)
 *              y un destroy() limpio para el desmontaje de Vue (FR-044).
 *
 *              La función es async porque PIXI.Application.init() es async en v8.
 *
 * @param {CombatOptions} options - Configuración y callbacks
 * @returns {Promise<CombatController>} Controlador con start() y destroy()
 * @throws {Error} Si `options.container` no es un HTMLElement válido
 */
export async function createCombatApp(options) {
  const {
    container,
    boss,
    passiveCards = [],
    debuffs = [],
    onPlayerHit,
    onBossDefeated,
    onBossHpChanged,
  } = options

  if (!(container instanceof HTMLElement)) {
    throw new Error('createCombatApp: container debe ser un HTMLElement válido')
  }

  // ─── Aplicación PixiJS ─────────────────────────────────────────────────────
  const app = new Application()
  await app.init({
    width: ARENA_WIDTH,
    height: ARENA_HEIGHT,
    backgroundColor: COLORS.bgTop,
    antialias: true,
    resolution: 1,
  })
  container.appendChild(app.canvas)
  // Desactiva el menú contextual del navegador sobre el canvas para que
  // el click derecho funcione como ataque básico (FR-020a).
  app.canvas.addEventListener('contextmenu', (e) => e.preventDefault())

  // ─── Estado del juego ──────────────────────────────────────────────────────
  const state = {
    bossHp: boss.maxHp,
    bossMaxHp: boss.maxHp,
    playerX: ARENA_WIDTH / 2 - PLAYER_W / 2,
    playerY: ARENA_HEIGHT - 130,
    keys: {},
    cursorX: ARENA_WIDTH / 2,
    cursorY: ARENA_HEIGHT / 2,
    activeZones: [],         // zonas de daño actualmente en pantalla
    telegraphTimer: 0,       // ms hasta que se ejecute el siguiente ataque
    currentPattern: null,
    telegraphActive: false,
    isDestroyed: false,
    basicAttackCooldown: 0,  // ms restantes de cooldown
    swingTimer: 0,           // ms restantes de animación de swing
    swingX: 0,
    swingY: 0,
    elapsed: 0,              // tiempo total para animaciones de idle
    shieldUntil: 0,          // state.elapsed hasta el que el jugador es invulnerable
    shieldFlash: 0,          // ms restantes del flash visual al bloquear un golpe
  }

  // ─── Contenedores gráficos ─────────────────────────────────────────────────
  const bgGfx = new Graphics()
  const floorGfx = new Graphics()
  const telegraphGfx = new Graphics()
  const bossGfx = new Graphics()
  const playerGfx = new Graphics()
  const swingGfx = new Graphics()

  app.stage.addChild(bgGfx, floorGfx, telegraphGfx, bossGfx, playerGfx, swingGfx)

  // ─── Fondo con gradiente vertical y viñeta ─────────────────────────────────
  // Pixi v8 no tiene gradiente nativo: simulamos con bandas horizontales.
  const BAND_COUNT = 32
  for (let i = 0; i < BAND_COUNT; i++) {
    const t = i / (BAND_COUNT - 1)
    const r = Math.round(((COLORS.bgTop >> 16) & 0xff) * (1 - t) + ((COLORS.bgBottom >> 16) & 0xff) * t)
    const g = Math.round(((COLORS.bgTop >> 8) & 0xff) * (1 - t) + ((COLORS.bgBottom >> 8) & 0xff) * t)
    const b = Math.round((COLORS.bgTop & 0xff) * (1 - t) + (COLORS.bgBottom & 0xff) * t)
    const color = (r << 16) | (g << 8) | b
    bgGfx.rect(0, (ARENA_HEIGHT / BAND_COUNT) * i, ARENA_WIDTH, ARENA_HEIGHT / BAND_COUNT + 1).fill(color)
  }

  // ─── Suelo de arena (decorativo, sin colisión) ─────────────────────────────
  // Plataforma elíptica grande que sugiere la zona de juego.
  floorGfx
    .ellipse(ARENA_WIDTH / 2, ARENA_HEIGHT - 40, ARENA_WIDTH * 0.55, 90)
    .fill({ color: COLORS.arenaFloor, alpha: 0.55 })
  floorGfx
    .ellipse(ARENA_WIDTH / 2, ARENA_HEIGHT - 40, ARENA_WIDTH * 0.55, 90)
    .stroke({ color: COLORS.arenaEdgeAlt, width: 3, alpha: 0.6 })
  // Líneas decorativas en los bordes de la arena (FR-018 estilo arcade)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const cx = ARENA_WIDTH / 2 + Math.cos(angle) * 380
    const cy = ARENA_HEIGHT - 40 + Math.sin(angle) * 70
    floorGfx.circle(cx, cy, 6).fill({ color: COLORS.arenaEdge, alpha: 0.35 })
  }

  // ─── Entrada de teclado y mouse ────────────────────────────────────────────
  function onKeyDown(e) { state.keys[e.code] = true }
  function onKeyUp(e) { state.keys[e.code] = false }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  function onMouseMove(e) {
    const rect = app.canvas.getBoundingClientRect()
    // Reescala las coordenadas del mouse al espacio lógico 960×540 por si el
    // canvas está visualmente escalado por CSS.
    state.cursorX = ((e.clientX - rect.left) / rect.width) * ARENA_WIDTH
    state.cursorY = ((e.clientY - rect.top) / rect.height) * ARENA_HEIGHT
  }
  function onMouseDown(e) {
    // Botón 2 = click derecho → ataque básico (FR-020a, FR-020b)
    if (e.button === 2) {
      e.preventDefault()
      tryBasicAttack()
    }
  }
  app.canvas.addEventListener('mousemove', onMouseMove)
  app.canvas.addEventListener('mousedown', onMouseDown)

  // ─── Ataque básico ─────────────────────────────────────────────────────────
  /**
   * @description Ejecuta el ataque básico del jugador si el cooldown lo permite (FR-020b).
   *              Daño = (10 + flat_bonus) × multiplicador, calculado por DamageCalculator
   *              usando las cartas Pasivas equipadas y los debuffs activos.
   *              Activa una animación visual de swing en la posición del cursor.
   */
  function tryBasicAttack() {
    if (state.isDestroyed || state.bossHp <= 0) return
    if (state.basicAttackCooldown > 0) return
    state.basicAttackCooldown = BASIC_ATTACK_COOLDOWN_MS
    state.swingTimer = BASIC_SWING_DURATION_MS
    state.swingX = state.cursorX
    state.swingY = state.cursorY
    applyDamageToBoss(BASIC_ATTACK_BASE_DAMAGE)
  }

  // ─── Aplicación de daño al jefe (compartido por cartas y ataque básico) ───
  function applyDamageToBoss(rawDamage) {
    const finalDamage = calculateDamage(rawDamage, passiveCards, debuffs)
    state.bossHp = Math.max(0, state.bossHp - finalDamage)
    onBossHpChanged?.(state.bossHp)
    if (state.bossHp === 0) {
      onBossDefeated?.()
    }
  }

  // ─── Telegrafiado y ejecución de patrones ──────────────────────────────────
  function beginTelegraph() {
    const eligible = getEligiblePatterns(boss.attackPatterns, state.bossHp, state.bossMaxHp)
    if (eligible.length === 0) return

    state.currentPattern = pickPattern(eligible, Math.random)
    state.activeZones = state.currentPattern.zones ?? []
    state.telegraphTimer = state.currentPattern.telegraphDurationMs
    state.telegraphActive = true

    telegraphGfx.clear()
    for (const z of state.activeZones) {
      telegraphGfx
        .rect(z.x, z.y, z.width, z.height)
        .fill({ color: COLORS.telegraph, alpha: 0.35 })
      telegraphGfx
        .rect(z.x, z.y, z.width, z.height)
        .stroke({ color: COLORS.telegraph, width: 2, alpha: 0.9 })
    }
  }

  function fireAttack() {
    state.telegraphActive = false
    telegraphGfx.clear()

    // Flash de peligro
    for (const z of state.activeZones) {
      telegraphGfx.rect(z.x, z.y, z.width, z.height).fill({ color: COLORS.danger, alpha: 0.75 })
    }

    // Colisión con el jugador
    const playerRect = { x: state.playerX, y: state.playerY, width: PLAYER_W, height: PLAYER_H }
    const hits = getCollisions(playerRect, state.activeZones)
    if (hits.length > 0) {
      onPlayerHit?.(state.currentPattern.damage ?? 10)
    }

    // Limpia el flash tras 300 ms
    setTimeout(() => {
      if (!state.isDestroyed) telegraphGfx.clear()
    }, 300)

    state.activeZones = []
    state.currentPattern = null
  }

  /** Intervalo entre patrones de ataque (ms) */
  const PATTERN_INTERVAL = 3000
  let timeSinceLastAttack = PATTERN_INTERVAL

  // ─── Dibujo del jefe (animado) ─────────────────────────────────────────────
  function drawBoss() {
    bossGfx.clear()
    const cx = ARENA_WIDTH / 2
    const cy = 130 + Math.sin(state.elapsed / 600) * 6   // flotación suave
    // Sombra proyectada en el suelo (perspectiva)
    bossGfx.ellipse(cx, ARENA_HEIGHT - 60, BOSS_W / 2 + 10, 14).fill({ color: COLORS.shadow, alpha: 0.35 })
    // Aura externa
    bossGfx.ellipse(cx, cy, BOSS_W / 2 + 14, BOSS_H / 2 + 10).fill({ color: COLORS.bossGlow, alpha: 0.18 })
    // Cuerpo
    bossGfx.ellipse(cx, cy, BOSS_W / 2, BOSS_H / 2).fill(COLORS.boss)
    bossGfx.ellipse(cx, cy, BOSS_W / 2, BOSS_H / 2).stroke({ color: 0x4a0c0c, width: 3 })
    // Ojos
    bossGfx.circle(cx - 28, cy - 10, 9).fill(COLORS.bossEye)
    bossGfx.circle(cx + 28, cy - 10, 9).fill(COLORS.bossEye)
    bossGfx.circle(cx - 28, cy - 10, 4).fill(0x222222)
    bossGfx.circle(cx + 28, cy - 10, 4).fill(0x222222)
    // Boca
    bossGfx.arc(cx, cy + 18, 22, 0.1, Math.PI - 0.1).stroke({ color: 0x222222, width: 3 })
  }

  // ─── Dibujo del jugador (animado) ──────────────────────────────────────────
  function drawPlayer() {
    playerGfx.clear()
    const cx = state.playerX + PLAYER_W / 2
    const cy = state.playerY + PLAYER_H / 2
    // Sombra elíptica en el suelo justo bajo el jugador
    playerGfx.ellipse(cx, state.playerY + PLAYER_H + 4, PLAYER_W / 2 + 2, 5).fill({ color: COLORS.shadow, alpha: 0.45 })
    // Aura
    playerGfx.circle(cx, cy, PLAYER_W / 2 + 6).fill({ color: COLORS.playerGlow, alpha: 0.25 })
    // Cuerpo
    playerGfx.circle(cx, cy, PLAYER_W / 2).fill(COLORS.player)
    playerGfx.circle(cx, cy, PLAYER_W / 2).stroke({ color: 0x0a4a52, width: 2 })
    // Indicador de dirección hacia el cursor
    const dx = state.cursorX - cx
    const dy = state.cursorY - cy
    const len = Math.hypot(dx, dy) || 1
    const nx = dx / len
    const ny = dy / len
    playerGfx.circle(cx + nx * (PLAYER_W / 2 - 4), cy + ny * (PLAYER_W / 2 - 4), 4).fill(0x0a4a52)
    // Anillo de escudo activo (FR-020 efecto card_action_shield)
    const isShielded = state.elapsed < state.shieldUntil
    if (isShielded) {
      const pulse = 1 + Math.sin(state.elapsed / 90) * 0.12
      playerGfx
        .circle(cx, cy, (PLAYER_W / 2 + 10) * pulse)
        .stroke({ color: COLORS.shield, width: 3, alpha: 0.85 })
      playerGfx
        .circle(cx, cy, (PLAYER_W / 2 + 6) * pulse)
        .stroke({ color: COLORS.shield, width: 1, alpha: 0.45 })
    }
    // Flash extra al bloquear un golpe
    if (state.shieldFlash > 0) {
      const t = state.shieldFlash / 280
      playerGfx
        .circle(cx, cy, PLAYER_W / 2 + 22 * (1 - t))
        .stroke({ color: 0xffffff, width: 4, alpha: t })
    }
  }

  // ─── Dibujo de la animación de swing del ataque básico ─────────────────────
  function drawSwing() {
    swingGfx.clear()
    if (state.swingTimer <= 0) return
    const t = state.swingTimer / BASIC_SWING_DURATION_MS  // 1 → 0
    const radius = 18 + (1 - t) * 26
    const alpha = t
    swingGfx
      .circle(state.swingX, state.swingY, radius)
      .stroke({ color: COLORS.basicSwing, width: 4, alpha })
    swingGfx
      .circle(state.swingX, state.swingY, radius * 0.55)
      .stroke({ color: COLORS.basicSwing, width: 2, alpha: alpha * 0.7 })
  }

  // ─── Game loop ─────────────────────────────────────────────────────────────
  function gameLoop(ticker) {
    if (state.isDestroyed) return
    const dt = ticker.deltaMS
    state.elapsed += dt

    // Movimiento del jugador
    const speed = PLAYER_BASE_SPEED * (dt / 1000)
    if (state.keys['ArrowLeft'] || state.keys['KeyA']) state.playerX -= speed
    if (state.keys['ArrowRight'] || state.keys['KeyD']) state.playerX += speed
    if (state.keys['ArrowUp'] || state.keys['KeyW']) state.playerY -= speed
    if (state.keys['ArrowDown'] || state.keys['KeyS']) state.playerY += speed

    // Confina al jugador dentro de la arena (zona inferior para no solapar al jefe)
    state.playerX = Math.max(0, Math.min(ARENA_WIDTH - PLAYER_W, state.playerX))
    state.playerY = Math.max(220, Math.min(ARENA_HEIGHT - PLAYER_H, state.playerY))

    // Cooldown del ataque básico
    if (state.basicAttackCooldown > 0) {
      state.basicAttackCooldown = Math.max(0, state.basicAttackCooldown - dt)
    }
    if (state.swingTimer > 0) {
      state.swingTimer = Math.max(0, state.swingTimer - dt)
    }
    if (state.shieldFlash > 0) {
      state.shieldFlash = Math.max(0, state.shieldFlash - dt)
    }

    drawBoss()
    drawPlayer()
    drawSwing()

    // Ciclo telegrafiado / ataque
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

  // ─── Controlador ───────────────────────────────────────────────────────────
  const controller = {
    /**
     * @description Arranca el ticker de PixiJS (game loop). Debe llamarse tras
     *              montar el componente para asegurar que el canvas está en el DOM.
     * @returns {void}
     */
    start() {
      app.ticker.add(gameLoop)
    },

    /**
     * @description Aplica daño al jefe y dispara onBossDefeated() si llega a 0.
     *              Llamado desde CombatView cuando el jugador activa una carta de Acción.
     * @param {number} damage - Daño base a restar al HP del jefe (≥ 0)
     * @returns {void}
     */
    dealDamageToBoss(damage) {
      if (state.isDestroyed || state.bossHp <= 0) return
      applyDamageToBoss(damage)
    },

    /**
     * @description Activa el escudo del jugador durante `durationMs` milisegundos.
     *              Mientras esté activo, las zonas de daño no aplican onPlayerHit (FR-020,
     *              carta card_action_shield). Si ya había escudo activo, se reemplaza.
     * @param {number} durationMs - Duración del escudo en ms
     * @returns {void}
     */
    activateShield(durationMs) {
      if (state.isDestroyed) return
      state.shieldUntil = state.elapsed + durationMs
    },

    /**
     * @description Teletransporta al jugador `distance` píxeles en la dirección del cursor
     *              (carta card_action_teleport). Se clampea a los límites de la arena.
     * @param {number} distance - Distancia en píxeles
     * @returns {void}
     */
    teleportPlayer(distance) {
      if (state.isDestroyed) return
      const cx = state.playerX + PLAYER_W / 2
      const cy = state.playerY + PLAYER_H / 2
      const dx = state.cursorX - cx
      const dy = state.cursorY - cy
      const len = Math.hypot(dx, dy) || 1
      state.playerX += (dx / len) * distance
      state.playerY += (dy / len) * distance
      state.playerX = Math.max(0, Math.min(ARENA_WIDTH  - PLAYER_W, state.playerX))
      state.playerY = Math.max(220, Math.min(ARENA_HEIGHT - PLAYER_H, state.playerY))
    },

    /**
     * @description Inflige un ataque básico amplificado por `mult` (carta
     *              card_action_heavy_strike: golpe pesado con multiplicador de daño).
     *              Reutiliza el daño base del ataque básico (10) escalado por mult.
     * @param {number} mult - Multiplicador de daño (ej: 3 para Golpe Pesado)
     * @returns {void}
     */
    dealBasicAttackWithMult(mult) {
      if (state.isDestroyed || state.bossHp <= 0) return
      applyDamageToBoss(BASIC_ATTACK_BASE_DAMAGE * mult)
      // Visual: swing más grande sobre el jefe
      state.swingTimer = BASIC_SWING_DURATION_MS * 1.5
      state.swingX = ARENA_WIDTH / 2
      state.swingY = 150
    },

    /**
     * @description Destruye la app PixiJS y elimina todos los event listeners.
     *              Debe llamarse en onUnmounted() de Vue para evitar memory leaks (FR-044).
     * @returns {void}
     */
    destroy() {
      if (state.isDestroyed) return
      state.isDestroyed = true
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      app.canvas.removeEventListener('mousemove', onMouseMove)
      app.canvas.removeEventListener('mousedown', onMouseDown)
      app.ticker.remove(gameLoop)
      app.destroy(true, { children: true })
    },
  }

  return controller
}
