<template>
  <div class="combat-view">
    <!-- PixiJS canvas mounts here -->
    <div
      ref="pixiContainer"
      class="combat-view__canvas"
    />

    <!-- Vue HUD overlay — positioned absolute on top of the canvas (FR-044) -->
    <div
      v-if="boss"
      class="combat-view__hud"
    >
      <!-- Top: Boss HP bar -->
      <div class="combat-view__hud-top">
        <BossHealthBar
          :boss-name="boss.name"
          :hp="bossHp"
          :max-hp="boss.maxHp"
        />
      </div>

      <!-- Bottom: Player HP + action card cooldowns -->
      <div class="combat-view__hud-bottom">
        <HealthBar
          :hp="playerHp"
          :max-hp="playerMaxHp"
        />
        <div class="combat-view__cooldowns">
          <CooldownIndicator
            v-for="card in actionCards"
            :key="card.id"
            :card-name="card.name"
            :cooldown-total="card.cooldown ?? 0"
            :cooldown-remaining="cooldowns[card.id] ?? 0"
          />
        </div>
      </div>

      <!-- Debuff indicators -->
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
    </div>

    <!-- No boss loaded (dev mode shortcut) -->
    <div
      v-else
      class="combat-view__no-boss"
    >
      <p>⚠️ No hay jefe cargado en gameStore.currentBoss</p>
      <p>Usa el DevNav para ir a otro punto del juego primero.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore.js'
import { usePlayerStore } from '@/stores/playerStore.js'
import { useDeckStore } from '@/stores/deckStore.js'
import { createCombatApp } from '@/engine/combat/CombatEngine.js'
import BossHealthBar from '@/components/hud/BossHealthBar.vue'
import HealthBar from '@/components/hud/HealthBar.vue'
import CooldownIndicator from '@/components/hud/CooldownIndicator.vue'

/**
 * @description Combat screen: mounts PixiJS canvas in onMounted, destroys in onUnmounted (FR-044).
 *              Overlays Vue HUD with reactive player/boss HP and card cooldowns.
 *              Reads boss from gameStore.currentBoss; in dev mode, loads first boss from JSON.
 */

const router      = useRouter()
const gameStore   = useGameStore()
const playerStore = usePlayerStore()
const deckStore   = useDeckStore()

const pixiContainer = ref(null)

// ─── Boss state ─────────────────────────────────────────────────────────────
const boss   = ref(gameStore.currentBoss)
const bossHp = ref(boss.value?.maxHp ?? 0)

// In dev mode, load a placeholder boss from JSON if none is set in store
async function loadDevBoss() {
  if (boss.value) return
  try {
    const { default: bosses } = await import('@/assets/data/bosses.json')
    boss.value   = bosses[0]
    bossHp.value = bosses[0].maxHp
    gameStore.currentBoss   = bosses[0]
    gameStore.bossHp        = bosses[0].maxHp
    gameStore.bossMaxHp     = bosses[0].maxHp
    gameStore.currentPhase  = 'combat'
  } catch {
    // bosses.json not available — combat view shows warning
  }
}

// ─── Player state (snapshot at combat start) ─────────────────────────────────
const playerHp    = ref(playerStore.hp)
const playerMaxHp = ref(playerStore.maxHp)
const playerDebuffs = computed(() => playerStore.activeDebuffs)

// ─── Cards & cooldowns ───────────────────────────────────────────────────────
const actionCards = computed(() => deckStore.actionCards)
const cooldowns   = reactive({})   // cardId → remaining seconds

/**
 * @description Returns a human-readable label for a debuff entry shown in the HUD.
 * @param {{ type: string, magnitude: number }} debuff
 * @returns {string}
 */
function debuffLabel(debuff) {
  const icons = { damage: '⚔️ -', speed: '🐌 -', hp: '💔 -' }
  return `${icons[debuff.type] ?? '⚠️'} ${Math.round(debuff.magnitude * 100)}% ${debuff.type}`
}

// ─── CombatEngine controller ─────────────────────────────────────────────────
let combatController = null

/**
 * @description Activates an action card: deals damage to boss and starts cooldown timer.
 * @param {import('@/engine/entities/Card.js').Card} card - The action card to activate
 * @returns {void}
 */
function activateCard(card) {
  if ((cooldowns[card.id] ?? 0) > 0) return
  const damage = card.effect?.damage ?? 0
  combatController?.dealDamageToBoss(damage)
  // Start cooldown countdown
  cooldowns[card.id] = card.cooldown ?? 0
  const interval = setInterval(() => {
    cooldowns[card.id] = Math.max(0, (cooldowns[card.id] ?? 0) - 0.1)
    if (cooldowns[card.id] <= 0) clearInterval(interval)
  }, 100)
}

// Expose activateCard for keyboard shortcut (keys 1-4)
function onKeyPress(e) {
  const idx = parseInt(e.key) - 1
  const card = actionCards.value[idx]
  if (card) activateCard(card)
}

onMounted(async () => {
  await loadDevBoss()
  if (!boss.value || !pixiContainer.value) return

  const passiveCards  = deckStore.passiveCards
  const activeDebuffs = playerStore.activeDebuffs

  combatController = await createCombatApp({
    container: pixiContainer.value,
    boss:      boss.value,
    passiveCards,
    debuffs:   activeDebuffs,

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
      bossHp.value        = hp
      gameStore.bossHp    = hp
    },
  })

  combatController.start()
  window.addEventListener('keypress', onKeyPress)
})

onUnmounted(() => {
  combatController?.destroy()
  window.removeEventListener('keypress', onKeyPress)
})
</script>

<style scoped>
.combat-view {
  position: relative;
  width: 960px;
  height: 540px;
  margin: 0 auto;
  background: #0d1b2a;
  overflow: hidden;
}

.combat-view__canvas {
  position: absolute;
  inset: 0;
}

.combat-view__hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px 12px;
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

.combat-view__cooldowns {
  display: flex;
  gap: 8px;
  pointer-events: all;
}

.combat-view__debuffs {
  position: absolute;
  top: 44px;
  left: 12px;
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
