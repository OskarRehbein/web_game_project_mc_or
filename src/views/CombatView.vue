<template>
  <div class="combat-view">
    <!-- Wrapper que mantiene la relación de aspecto 16:9 y escala con CSS -->
    <div
      class="combat-view__stage"
      :style="stageStyle"
    >
      <!-- Lienzo de PixiJS — el motor monta el <canvas> aquí -->
      <div
        ref="pixiContainer"
        class="combat-view__canvas"
      />

      <!-- Overlay HUD en Vue, posicionado encima del lienzo (FR-044) -->
      <div
        v-if="boss"
        class="combat-view__hud"
      >
        <!-- Barra de vida del jefe (arriba) -->
        <div class="combat-view__hud-top">
          <BossHealthBar
            :boss-name="boss.name"
            :hp="bossHp"
            :max-hp="boss.maxHp"
          />
        </div>

        <!-- Indicadores de debuff -->
        <div
          v-if="playerDebuffs.length"
          class="combat-view__debuffs"
        >
          <span
            v-for="d in playerDebuffs"
            :key="d.type"
            class="combat-view__debuff-tag"
          >
            {{ debuffLabel(d) }}
          </span>
        </div>

        <!-- Pista de controles (arriba a la derecha) -->
        <div class="combat-view__controls-hint">
          <span><kbd>WASD</kbd> moverse</span>
          <span><kbd>Click izq</kbd> usar carta</span>
          <span><kbd>Click der</kbd> ataque melee (acércate al jefe)</span>
        </div>

        <!-- HUD inferior: vida jugador (izq) + hotbar (der) -->
        <div class="combat-view__hud-bottom">
          <div class="combat-view__hp-block">
            <HealthBar
              :hp="playerHp"
              :max-hp="playerMaxHp"
            />
            <GoldCounter />
          </div>

          <div class="combat-view__hotbar">
            <button
              v-for="(card, idx) in actionCards"
              :key="card.id"
              class="hotbar-slot"
              :class="{ 'hotbar-slot--cooling': (cooldowns[card.id] ?? 0) > 0 }"
              :disabled="(cooldowns[card.id] ?? 0) > 0"
              @click="activateCard(card)"
            >
              <span class="hotbar-slot__key">{{ idx + 1 }}</span>
              <span class="hotbar-slot__name">{{ card.name }}</span>
              <div
                v-if="(cooldowns[card.id] ?? 0) > 0"
                class="hotbar-slot__cooldown"
                :style="{
                  background: `conic-gradient(from -90deg, rgba(0,0,0,0.65) 0deg ${((cooldowns[card.id] ?? 0) / ((card.cooldown || 1) * 1000)) * 360}deg, transparent ${((cooldowns[card.id] ?? 0) / ((card.cooldown || 1) * 1000)) * 360}deg 360deg)`,
                }"
              >
                <span class="hotbar-slot__cooldown-text">
                  {{ ((cooldowns[card.id] ?? 0) / 1000).toFixed(1) }}s
                </span>
              </div>
            </button>
            <div
              v-if="actionCards.length === 0"
              class="hotbar-empty"
            >
              Sin cartas de Acción · usa <kbd>click derecho</kbd>
            </div>
          </div>
        </div>
      </div>

      <!-- Sin jefe cargado (atajo dev) -->
      <div
        v-else
        class="combat-view__no-boss"
      >
        <p>⚠️ No hay jefe cargado en gameStore.currentBoss</p>
        <p>Usa el DevNav para ir a otro punto del juego primero.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore.js'
import { usePlayerStore } from '@/stores/playerStore.js'
import { useDeckStore } from '@/stores/deckStore.js'
import { createCombatApp } from '@/engine/combat/CombatEngine.js'
import BossHealthBar from '@/components/hud/BossHealthBar.vue'
import HealthBar from '@/components/hud/HealthBar.vue'
import GoldCounter from '@/components/hud/GoldCounter.vue'

/**
 * @description Pantalla de combate fullscreen. Monta el canvas PixiJS en onMounted,
 *              lo destruye en onUnmounted (FR-044). Renderiza el HUD Vue por encima
 *              con HP reactivo y hotbar clickeable de cartas de Acción.
 *              El motor lee al jefe desde gameStore.currentBoss; en modo dev, carga
 *              el primer jefe desde JSON.
 *
 *              Layout: el stage interno mantiene 960×540 (16:9) y se escala con CSS
 *              para ocupar la ventana sin distorsionar.
 */

const router      = useRouter()
const gameStore   = useGameStore()
const playerStore = usePlayerStore()
const deckStore   = useDeckStore()

const pixiContainer = ref(null)

// ─── Estado del jefe ────────────────────────────────────────────────────────
const boss   = ref(gameStore.currentBoss)
const bossHp = ref(boss.value?.maxHp ?? 0)

/** Carga un jefe dev si no hay uno seleccionado en gameStore. */
async function loadDevBoss() {
  if (boss.value) return
  try {
    const { default: bosses } = await import('@/assets/data/bosses.json')
    boss.value   = bosses[0]
    bossHp.value = bosses[0].maxHp
    gameStore.currentBoss  = bosses[0]
    gameStore.bossHp       = bosses[0].maxHp
    gameStore.bossMaxHp    = bosses[0].maxHp
    gameStore.currentPhase = 'combat'
  } catch {
    // bosses.json no disponible — la vista mostrará el aviso
  }
}

// ─── Estado del jugador (snapshot al inicio del combate) ────────────────────
const playerHp      = ref(playerStore.hp)
const playerMaxHp   = ref(playerStore.maxHp)
const playerDebuffs = computed(() => playerStore.activeDebuffs)

// ─── Cartas y cooldowns ─────────────────────────────────────────────────────
const actionCards = computed(() => deckStore.actionCards)
/**
 * Cooldowns por carta en MILISEGUNDOS restantes (los valores de cards.json están
 * en segundos; aquí se convierten al activar la carta y se decrementan suave en
 * cada frame con requestAnimationFrame para que el contador se vea bajar en
 * decimales).
 */
const cooldowns = reactive({})
let cooldownRafId = null
let cooldownLastTs = 0

function tickCooldowns(ts) {
  if (!cooldownLastTs) cooldownLastTs = ts
  const dt = ts - cooldownLastTs
  cooldownLastTs = ts
  let anyActive = false
  for (const id of Object.keys(cooldowns)) {
    if (cooldowns[id] > 0) {
      cooldowns[id] = Math.max(0, cooldowns[id] - dt)
      if (cooldowns[id] > 0) anyActive = true
    }
  }
  if (anyActive) {
    cooldownRafId = requestAnimationFrame(tickCooldowns)
  } else {
    cooldownRafId = null
    cooldownLastTs = 0
  }
}

function startCooldownLoop() {
  if (cooldownRafId == null) {
    cooldownLastTs = 0
    cooldownRafId = requestAnimationFrame(tickCooldowns)
  }
}

/**
 * @description Devuelve la etiqueta legible para un debuff mostrado en el HUD.
 * @param {{ type: string, magnitude: number }} debuff
 * @returns {string}
 */
function debuffLabel(debuff) {
  const labels = { damage: 'daño', speed: 'velocidad', hp: 'vida' }
  const icons  = { damage: '⚔️', speed: '🐌', hp: '💔' }
  return `${icons[debuff.type] ?? '⚠️'} -${Math.round(debuff.magnitude * 100)}% ${labels[debuff.type] ?? debuff.type}`
}

// ─── Controlador del CombatEngine ───────────────────────────────────────────
let combatController = null

/**
 * @description Activa una carta de Acción: aplica su efecto al motor y arranca el cooldown.
 *              Despacha según el tipo de efecto declarado en cards.json:
 *                - `damage`           → daño directo al jefe
 *                - `damageMult`       → ataque básico amplificado (Golpe Pesado)
 *                - `shieldDurationMs` → invulnerabilidad temporal (Escudo)
 *                - `teleportDistance` → teletransporte hacia el cursor
 *              Disparable con click izquierdo en el slot o con las teclas 1-4 (FR-020a).
 * @param {import('@/engine/entities/Card.js').Card} card - Carta de Acción a activar
 * @returns {void}
 */
function activateCard(card) {
  if (!card) return
  if ((cooldowns[card.id] ?? 0) > 0) return
  if (!combatController) return

  const fx = card.effect ?? {}
  if (typeof fx.damage === 'number' && fx.damage > 0) {
    combatController.dealDamageToBoss(fx.damage)
  } else if (typeof fx.damageMult === 'number' && fx.damageMult > 0) {
    combatController.dealBasicAttackWithMult(fx.damageMult)
  } else if (typeof fx.shieldDurationMs === 'number' && fx.shieldDurationMs > 0) {
    combatController.activateShield(fx.shieldDurationMs)
  } else if (typeof fx.teleportDistance === 'number' && fx.teleportDistance > 0) {
    combatController.teleportPlayer(fx.teleportDistance)
  }

  // Arranca cuenta regresiva del cooldown (cards.json lo define en segundos)
  cooldowns[card.id] = (card.cooldown ?? 0) * 1000
  startCooldownLoop()
}

/** Atajo de teclado 1-4 para activar cartas (FR-020a). */
function onKeyPress(e) {
  const idx = parseInt(e.key, 10) - 1
  if (Number.isNaN(idx)) return
  const card = actionCards.value[idx]
  if (card) activateCard(card)
}

// ─── Escalado responsive del stage 960×540 ──────────────────────────────────
const stageScale = ref(1)

/** Calcula la mayor escala que cabe en la ventana manteniendo el aspecto 16:9. */
function recomputeScale() {
  const scaleX = window.innerWidth  / 960
  const scaleY = window.innerHeight / 540
  stageScale.value = Math.min(scaleX, scaleY)
}

const stageStyle = computed(() => ({
  transform: `translate(-50%, -50%) scale(${stageScale.value})`,
}))

onMounted(async () => {
  recomputeScale()
  window.addEventListener('resize', recomputeScale)

  await loadDevBoss()
  if (!boss.value || !pixiContainer.value) return

  const passiveCards  = deckStore.passiveCards
  const activeDebuffs = playerStore.activeDebuffs

  combatController = await createCombatApp({
    container:    pixiContainer.value,
    boss:         boss.value,
    passiveCards,
    debuffs:      activeDebuffs,

    onPlayerHit(damage) {
      playerStore.applyDamage(damage)
      playerHp.value = playerStore.hp
      if (!playerStore.isAlive) {
        combatController?.destroy()
        gameStore.resolveGameOver()
        router.push({ name: 'gameover' })
      }
    },

    onBossDefeated() {
      combatController?.destroy()
      gameStore.resolveCombatVictory()
      router.push({ name: 'reward' })
    },

    onBossHpChanged(hp) {
      bossHp.value     = hp
      gameStore.bossHp = hp
    },
  })

  combatController.start()
  window.addEventListener('keypress', onKeyPress)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', recomputeScale)
})

onUnmounted(() => {
  combatController?.destroy()
  window.removeEventListener('keypress', onKeyPress)
  if (cooldownRafId != null) {
    cancelAnimationFrame(cooldownRafId)
    cooldownRafId = null
  }
})
</script>

<style scoped>
.combat-view {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: #050d1a;
  overflow: hidden;
}

/* El stage es un rectángulo lógico de 960×540 px centrado y escalado vía CSS */
.combat-view__stage {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 960px;
  height: 540px;
  transform-origin: center center;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.6);
}

.combat-view__canvas {
  position: absolute;
  inset: 0;
}

/* HUD escala junto al stage por estar dentro de él */
.combat-view__hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px 14px;
}

.combat-view__hud-top {
  width: 100%;
}

.combat-view__hud-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.combat-view__hp-block {
  pointer-events: none;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.combat-view__hotbar {
  display: flex;
  gap: 8px;
  pointer-events: all;
  background: rgba(5, 13, 26, 0.55);
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(4px);
}

.hotbar-slot {
  position: relative;
  width: 84px;
  height: 84px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px;
  border-radius: 8px;
  border: 2px solid #2a4a6a;
  background: linear-gradient(180deg, #0c2440 0%, #061528 100%);
  color: #e8e8f0;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.08s, box-shadow 0.15s;
}

.hotbar-slot:hover:not(:disabled) {
  border-color: #4488ff;
  box-shadow: 0 0 12px rgba(68, 136, 255, 0.5);
  transform: translateY(-2px);
}

.hotbar-slot:active:not(:disabled) {
  transform: translateY(0);
}

.hotbar-slot--cooling {
  cursor: not-allowed;
  opacity: 0.55;
}

.hotbar-slot__key {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 10px;
  font-weight: 700;
  color: #ffcc44;
}

.hotbar-slot__name {
  font-size: 10px;
  text-align: center;
  line-height: 1.1;
  max-height: 28px;
  overflow: hidden;
}

.hotbar-slot__cooldown {
  position: absolute;
  inset: 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.hotbar-slot__cooldown-text {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
}

.hotbar-empty {
  display: flex;
  align-items: center;
  padding: 0 14px;
  color: #88aacc;
  font-size: 12px;
  font-style: italic;
}

.combat-view__debuffs {
  position: absolute;
  top: 50px;
  left: 14px;
  display: flex;
  gap: 6px;
}

.combat-view__debuff-tag {
  background: rgba(200, 30, 30, 0.75);
  border: 1px solid #ff4444;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 11px;
  color: #fff;
}

.combat-view__controls-hint {
  position: absolute;
  top: 50px;
  right: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #aabbcc;
  font-size: 11px;
  background: rgba(5, 13, 26, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  padding: 6px 10px;
}

.combat-view__controls-hint kbd {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 3px;
  padding: 1px 5px;
  font-family: inherit;
  font-size: 10px;
  color: #ffcc44;
}

.combat-view__no-boss {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: #ffaa44;
  font-size: 14px;
  text-align: center;
  padding: 24px;
}
</style>
