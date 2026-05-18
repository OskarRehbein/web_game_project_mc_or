<template>
  <main class="deck-selection">
    <h1 class="deck-selection__title">
      ⚓ Elige tu Arquetipo
    </h1>
    <p class="deck-selection__subtitle">
      Cada arquetipo te da 2 cartas iniciales elegidas al azar del pool. Podrás ampliar tu mazo durante la aventura.
    </p>

    <div class="deck-selection__archetypes">
      <button
        v-for="archetype in archetypes"
        :key="archetype.id"
        class="archetype-card"
        :class="{ 'archetype-card--selected': selected === archetype.id }"
        @click="selected = archetype.id"
      >
        <div class="archetype-card__icon">
          {{ ARCHETYPE_ICONS[archetype.id] }}
        </div>
        <h2 class="archetype-card__name">
          {{ archetype.name }}
        </h2>
        <p class="archetype-card__desc">
          {{ archetype.description }}
        </p>

        <ul class="archetype-card__cards">
          <li
            v-for="(type, idx) in archetype.composition"
            :key="idx"
            class="archetype-card__card-item"
            :class="`archetype-card__card-item--${type}`"
          >
            {{ TYPE_ICONS[type] }} 1 carta {{ TYPE_LABELS[type] }} aleatoria
          </li>
        </ul>

        <span
          v-if="selected === archetype.id"
          class="archetype-card__selected-badge"
        >✓ Seleccionado</span>
      </button>
    </div>

    <Button
      class="deck-selection__start-btn"
      :disabled="!selected"
      @click="onStart"
    >
      Comenzar Aventura →
    </Button>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore.js'
import { useDeckStore } from '@/stores/deckStore.js'
import { ARCHETYPES } from '@/engine/entities/DeckArchetype.js'
import Button from '@/components/shared/Button.vue'

const router    = useRouter()
const gameStore = useGameStore()
const deckStore = useDeckStore()

/** Currently selected archetype id, null if none chosen yet. */
const selected = ref(null)

/** Array form of ARCHETYPES for v-for iteration. */
const archetypes = computed(() => Object.values(ARCHETYPES))

const ARCHETYPE_ICONS = { pirata: '🏴‍☠️', navegante: '🧭' }
const TYPE_ICONS      = { action: '⚡', passive: '🛡️', utility: '🔧' }
const TYPE_LABELS     = { action: 'de Acción', passive: 'Pasiva', utility: 'de Utilidad' }

/**
 * @description Inicia una nueva partida con el arquetipo elegido y navega al mapa.
 *              Las cartas iniciales se eligen aleatoriamente del pool en ese momento.
 */
function onStart() {
  if (!selected.value) return
  gameStore.startNewRun(selected.value)
  deckStore.initWithArchetype(selected.value)
  router.push({ name: 'map' })
}
</script>

<style scoped>
.deck-selection {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 48px 24px;
  background: radial-gradient(ellipse at center, #0d2440 0%, #050d1a 100%);
  color: #e8e8f0;
}

.deck-selection__title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #ffcc44;
  margin: 0;
}

.deck-selection__subtitle {
  color: #7788aa;
  font-size: 1rem;
  margin: 0;
  text-align: center;
  max-width: 560px;
}

.deck-selection__archetypes {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  justify-content: center;
}

.archetype-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 280px;
  padding: 28px 22px;
  border-radius: 12px;
  border: 2px solid #1e3a5a;
  background: #071828;
  color: #e8e8f0;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.15s, box-shadow 0.15s;
}

.archetype-card:hover {
  border-color: #3a6a9a;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
}

.archetype-card--selected {
  border-color: #4488ff;
  box-shadow: 0 0 0 3px rgba(68, 136, 255, 0.35);
}

.archetype-card__icon {
  font-size: 2.4rem;
}

.archetype-card__name {
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0;
}

.archetype-card__desc {
  font-size: 0.85rem;
  color: #7788aa;
  margin: 0;
  line-height: 1.5;
}

.archetype-card__cards {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid #1e3a5a;
  padding-top: 12px;
}

.archetype-card__card-item {
  font-size: 0.82rem;
  padding: 4px 10px;
  border-radius: 4px;
  background: #0d1f35;
  color: #aabbcc;
}

.archetype-card__card-item--action  { color: #ffcc44; }
.archetype-card__card-item--passive { color: #88bbff; }
.archetype-card__card-item--utility { color: #88dd88; }

.archetype-card__selected-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #4488ff;
  background: rgba(68, 136, 255, 0.12);
  padding: 2px 8px;
  border-radius: 12px;
}

.deck-selection__start-btn {
  margin-top: 8px;
  font-size: 1.1rem;
  padding: 14px 40px;
}
</style>
