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
          <span><kbd>Click der</kbd> ataque básico</span>
        </div>

        <!-- HUD inferior: vida jugador (izq) + hotbar (der) -->
        <div class="combat-view__hud-bottom">
          <div class="combat-view__hp-block">
            <HealthBar
              :hp="playerHp"
              :max-hp="playerMaxHp"
            />
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
              <CooldownIndicator
                :card-name="card.name"
                :cooldown-total="card.cooldown ?? 0"
                :cooldown-remaining="cooldowns[card.id] ?? 0"
              />
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
import CooldownIndicator from '@/components/hud/CooldownIndicator.vue'

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
const cooldowns   = reactive({})

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
 * @description Activa una carta de Acción: aplica daño al jefe y arranca el cooldown.
 *              Disparable con click izquierdo en el slot de la hotbar o con las teclas 1-4
 *              (FR-020a).
 * @param {import('@/engine/entities/Card.js').Card} card - Carta de Acción a activar
 * @returns {void}
 */
function activateCard(card) {
  if (!card) return
  if ((cooldowns[card.id] ?? 0) > 0) return
  const damage = card.effect?.damage ?? 0
  combatController?.dealDamageToBoss(damage)
  // Arranca cuenta regresiva del cooldown
  cooldowns[card.id] = card.cooldown ?? 0
  const interval = setInterval(() => {
    cooldowns[card.id] = Math.max(0, (cooldowns[card.id] ?? 0) - 0.1)
    if (cooldowns[card.id] <= 0) clearInterval(interval)
  }, 100)
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
