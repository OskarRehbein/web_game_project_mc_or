<template>
  <div class="gameover-view">
    <div class="gameover-view__skull">
      💀
    </div>
    <h1 class="gameover-view__title">
      Game Over
    </h1>
    <p class="gameover-view__subtitle">
      Las profundidades te han reclamado.
    </p>

    <div
      v-if="stats.islandsCompleted > 0 || stats.bossesDefeated > 0"
      class="gameover-view__stats"
    >
      <div class="gameover-view__stat">
        <span class="gameover-view__stat-value">{{ stats.islandsCompleted }}</span>
        <span class="gameover-view__stat-label">Islas completadas</span>
      </div>
      <div class="gameover-view__stat">
        <span class="gameover-view__stat-value">{{ stats.bossesDefeated }}</span>
        <span class="gameover-view__stat-label">Jefes derrotados</span>
      </div>
      <div class="gameover-view__stat">
        <span class="gameover-view__stat-value">{{ stats.goldCollected }}</span>
        <span class="gameover-view__stat-label">Oro acumulado</span>
      </div>
    </div>

    <div class="gameover-view__actions">
      <Button
        variant="primary"
        @click="onRetry"
      >
        🔄 Reintentar
      </Button>
      <Button
        variant="secondary"
        @click="onMenu"
      >
        🏠 Menú principal
      </Button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore.js'
import { usePlayerStore } from '@/stores/playerStore.js'
import Button from '@/components/shared/Button.vue'

/**
 * @description Game Over screen shown when the player's HP reaches 0 (FR-004).
 *              Displays run statistics and offers retry (new run) or main menu options.
 */

const router      = useRouter()
const gameStore   = useGameStore()
const playerStore = usePlayerStore()

/**
 * @description Summary stats from the current (ended) run.
 * @returns {{ islandsCompleted: number, bossesDefeated: number, goldCollected: number }}
 */
const stats = computed(() => ({
  islandsCompleted: gameStore.regularIslandsCompleted,
  bossesDefeated:   gameStore.bossIslandsDefeated.length,
  goldCollected:    playerStore.gold,
}))

/**
 * @description Starts a new run and navigates to deck selection (FR-003).
 * @returns {void}
 */
function onRetry() {
  gameStore.startNewRun(gameStore.chosenArchetype ?? 'balanced')
  router.push({ name: 'deck-select' })
}

/**
 * @description Resets the run and navigates to the main menu.
 * @returns {void}
 */
function onMenu() {
  gameStore.startNewRun(gameStore.chosenArchetype ?? 'balanced')
  router.push({ name: 'menu' })
}
</script>

<style scoped>
.gameover-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 40px 24px;
  background: radial-gradient(ellipse at center, #1a0a0a 0%, #050508 100%);
  color: #e8e8f0;
}

.gameover-view__skull {
  font-size: 5rem;
  filter: drop-shadow(0 0 20px rgba(200, 30, 30, 0.6));
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.05); }
}

.gameover-view__title {
  font-size: 3.5rem;
  font-weight: 900;
  color: #cc2222;
  text-shadow: 0 0 30px rgba(200, 30, 30, 0.5);
  letter-spacing: 0.05em;
}

.gameover-view__subtitle {
  font-size: 1rem;
  color: #888;
  font-style: italic;
}

.gameover-view__stats {
  display: flex;
  gap: 32px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid #333;
  border-radius: 12px;
  padding: 20px 36px;
}

.gameover-view__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.gameover-view__stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: #e8e8f0;
}

.gameover-view__stat-label {
  font-size: 0.75rem;
  color: #777;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.gameover-view__actions {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}
</style>
