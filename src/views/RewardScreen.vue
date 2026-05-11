<template>
  <div class="reward-screen">
    <h1 class="reward-screen__title">
      ⚓ ¡Victoria!
    </h1>

    <div
      v-if="rewards"
      class="reward-screen__loot"
    >
      <!-- Gold reward -->
      <div
        v-if="rewards.gold"
        class="reward-screen__gold"
      >
        <span class="reward-screen__gold-icon">🪙</span>
        <span class="reward-screen__gold-label">+ {{ rewards.gold }} monedas de oro</span>
      </div>

      <!-- Card reward(s) -->
      <div
        v-if="rewards.cards?.length"
        class="reward-screen__cards"
      >
        <p class="reward-screen__subtitle">
          Carta{{ rewards.cards.length > 1 ? 's' : '' }} obtenida{{ rewards.cards.length > 1 ? 's' : '' }}:
        </p>
        <div class="reward-screen__card-list">
          <div
            v-for="card in rewards.cards"
            :key="card.id"
            class="reward-screen__card"
            :class="`reward-screen__card--${card.rarity}`"
          >
            <span class="reward-screen__card-name">{{ card.name }}</span>
            <span class="reward-screen__card-type">{{ typeLabel(card.type) }}</span>
            <p class="reward-screen__card-desc">
              {{ card.description }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="reward-screen__empty"
    >
      <p>No hay recompensas pendientes.</p>
    </div>

    <Button
      class="reward-screen__continue"
      @click="onContinue"
    >
      Continuar →
    </Button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore.js'
import Button from '@/components/shared/Button.vue'

/**
 * @description Reward screen shown after a successful combat encounter.
 *              Displays gold earned and card(s) obtained, then routes to the map.
 *              Reads pendingRewards from gameStore (set by resolveCombatVictory, FR-022).
 */

const router    = useRouter()
const gameStore = useGameStore()

/**
 * @description Pending rewards object from the store (gold + cards array).
 * @returns {{ gold?: number, cards?: import('@/engine/entities/Card.js').Card[] } | null}
 */
const rewards = computed(() => gameStore.pendingRewards)

const TYPE_LABELS = { action: '⚡ Acción', passive: '🛡️ Pasiva', utility: '🔧 Utilidad', weapon: '⚔️ Arma', armor: '🪬 Armadura' }

/**
 * @description Returns a human-readable label for a card type.
 * @param {string} type - Card type string
 * @returns {string}
 */
function typeLabel(type) {
  return TYPE_LABELS[type] ?? type
}

/**
 * @description Navigates to the map after the player acknowledges the rewards.
 *              Clears pendingRewards so the screen doesn't re-show stale data.
 * @returns {void}
 */
function onContinue() {
  gameStore.pendingRewards = null
  router.push({ name: 'map' })
}
</script>

<style scoped>
.reward-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 40px 24px;
  background: radial-gradient(ellipse at center, #0d2440 0%, #050d1a 100%);
  color: #e8e8f0;
}

.reward-screen__title {
  font-size: 3rem;
  font-weight: 800;
  color: #ffcc44;
  text-shadow: 0 0 24px rgba(255, 200, 60, 0.5);
}

.reward-screen__loot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 540px;
}

.reward-screen__gold {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 200, 60, 0.12);
  border: 1px solid #ffcc44;
  border-radius: 12px;
  padding: 14px 28px;
  font-size: 1.3rem;
  font-weight: 700;
}

.reward-screen__gold-icon { font-size: 2rem; }

.reward-screen__subtitle {
  font-size: 0.9rem;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}

.reward-screen__card-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.reward-screen__card {
  background: #0f1f33;
  border: 2px solid #334;
  border-radius: 10px;
  padding: 16px 20px;
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reward-screen__card--common  { border-color: #555; }
.reward-screen__card--rare    { border-color: #6644cc; box-shadow: 0 0 12px rgba(102, 68, 204, 0.4); }
.reward-screen__card--unique  { border-color: #ffaa00; box-shadow: 0 0 18px rgba(255, 170, 0, 0.5); }

.reward-screen__card-name {
  font-weight: 700;
  font-size: 1rem;
  color: #e8e8f0;
}

.reward-screen__card-type {
  font-size: 0.78rem;
  color: #aaa;
}

.reward-screen__card-desc {
  font-size: 0.8rem;
  color: #ccc;
  line-height: 1.4;
}

.reward-screen__empty { color: #666; font-style: italic; }

.reward-screen__continue { font-size: 1.1rem; padding: 12px 40px; }
</style>
