<template>
  <main class="victory-view">
    <section class="victory-view__card">
      <p class="victory-view__eyebrow">
        Partida Completada
      </p>
      <h1 class="victory-view__title">
        Te hiciste con el tesoro!!
      </h1>
      <p class="victory-view__intro">
        Tu viaje ha terminado. Estos son los tesoros con los que has vuelto.
      </p>

      <div class="victory-view__summary-grid">
        <article class="summary-block summary-block--gold">
          <span class="summary-block__label">Dinero</span>
          <strong class="summary-block__value">{{ goldLoot }} oro</strong>
          <span class="summary-block__note">All gold collected during the run.</span>
        </article>

        <article class="summary-block">
          <span class="summary-block__label">Items</span>
          <strong class="summary-block__value">{{ totalItems }} cartas</strong>
          <ul class="summary-list">
            <li>Accion: {{ cardCounts.action }}</li>
            <li>Utilidad: {{ cardCounts.utility }}</li>
            <li>armas: {{ cardCounts.weapon }}</li>
            <li>Armadura: {{ cardCounts.armor }}</li>
            <li>Pasivas: {{ cardCounts.passive }}</li>
          </ul>
        </article>

        <article class="summary-block">
          <span class="summary-block__label">Islas comunes</span>
          <strong class="summary-block__value">{{ gameStore.regularIslandsCompleted }}</strong>
          <span class="summary-block__note">Haz recorrido un total de {{ gameStore.regularIslandsCompleted }} islas. Vaya viaje!!.</span>
        </article>

        <article class="summary-block">
          <span class="summary-block__label">Jefes derrotados</span>
          <strong class="summary-block__value">{{ defeatedBossNames.length }}</strong>
          <ul class="summary-list">
            <li
              v-for="bossName in defeatedBossNames"
              :key="bossName"
            >
              {{ bossName }}
            </li>
            <li v-if="defeatedBossNames.length === 0">
              Llegaste a Fathom's End sin batallar? Increible!!.
            </li>
          </ul>
        </article>
      </div>

      <div class="victory-view__footer">
        <button
          class="victory-view__button"
          type="button"
          @click="playAgain"
        >
          Jugar de Nuevo
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore.js'
import { usePlayerStore } from '@/stores/playerStore.js'
import { useDeckStore } from '@/stores/deckStore.js'
import bossesData from '@/assets/data/bosses.json'

const router = useRouter()
const gameStore = useGameStore()
const playerStore = usePlayerStore()
const deckStore = useDeckStore()

const goldLoot = computed(() => playerStore.gold)

const cardCounts = computed(() => {
  const counts = {
    action: 0,
    passive: 0,
    utility: 0,
    weapon: 0,
    armor: 0,
  }

  for (const card of deckStore.cards) {
    if (card?.type in counts) {
      counts[card.type] += 1
    }
  }

  return counts
})

const totalItems = computed(() => deckStore.cards.length)

const defeatedBossNames = computed(() => {
  const bossById = new Map(bossesData.map((boss) => [boss.id, boss]))
  return gameStore.bossIslandsDefeated
    .map((bossId) => bossById.get(bossId)?.name ?? bossId)
    .filter(Boolean)
})

function playAgain() {
  // Reset all stores to their initial state
  playerStore.reset()
  gameStore.startNewRun()
  deckStore.reset()
  
  // Navigate back to main menu
  router.push('/')
}
</script>

<style scoped>
.victory-view {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 20px;
  background:
    radial-gradient(circle at top, rgba(43, 94, 140, 0.35), transparent 40%),
    linear-gradient(180deg, #07111f 0%, #03070d 100%);
  color: #eaf3ff;
}

.victory-view__card {
  width: min(100%, 920px);
  border: 1px solid rgba(126, 176, 222, 0.28);
  border-radius: 24px;
  padding: 32px;
  background: rgba(5, 14, 27, 0.88);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(10px);
}

.victory-view__eyebrow {
  margin: 0 0 8px;
  color: #7fb9ff;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.8rem;
}

.victory-view__title {
  margin: 0;
  font-size: clamp(2.2rem, 4vw, 4rem);
  line-height: 1;
}

.victory-view__intro {
  max-width: 60ch;
  margin: 16px 0 28px;
  color: rgba(234, 243, 255, 0.82);
  line-height: 1.6;
}

.victory-view__summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.summary-block {
  border: 1px solid rgba(126, 176, 222, 0.18);
  border-radius: 18px;
  padding: 20px;
  background: rgba(9, 22, 39, 0.72);
}

.summary-block--gold {
  background: linear-gradient(180deg, rgba(116, 86, 18, 0.35), rgba(9, 22, 39, 0.72));
}

.summary-block__label {
  display: block;
  margin-bottom: 10px;
  color: #87aff0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.75rem;
}

.summary-block__value {
  display: block;
  font-size: 1.7rem;
  margin-bottom: 8px;
}

.summary-block__note,
.victory-view__note,
.summary-list {
  color: rgba(234, 243, 255, 0.76);
  line-height: 1.5;
}

.summary-list {
  margin: 0;
  padding-left: 18px;
}

.summary-list li + li {
  margin-top: 4px;
}

.victory-view__footer {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-top: 28px;
  flex-wrap: wrap;
}

.victory-view__button {
  border: none;
  border-radius: 999px;
  padding: 14px 28px;
  background: linear-gradient(180deg, #7fb9ff 0%, #3d78d8 100%);
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(61, 120, 216, 0.32);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.victory-view__button:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(61, 120, 216, 0.4);
}

@media (max-width: 720px) {
  .victory-view__card {
    padding: 24px;
  }

  .victory-view__summary-grid {
    grid-template-columns: 1fr;
  }

  .victory-view__footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
