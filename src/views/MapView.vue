<template>
  <main class="map-view">
    <section class="map-view__shell">
      <header class="map-view__header">
        <div>
          <p class="map-view__eyebrow">
            Exploración
          </p>
          <h1 class="map-view__title">
            Mapa de islas
          </h1>
        </div>

        <p class="map-view__subtitle">
          Selecciona una isla. Las regulares abren un evento; las de jefe o final te llevan al combate.
        </p>
      </header>

      <MapCanvas
        :islands="islands"
        :selected-island-id="selectedIslandId"
        :columns="3"
        @select-island="navigateToIsland"
      />
    </section>

    <EventModal
      v-if="gameStore.currentEvent !== null"
      :event="gameStore.currentEvent"
      :show-result="showResult"
      :selected-outcome="selectedOutcome"
      :result-title="resultTitle"
      :result-content="resultContent"
      @select-decision="handleSelectDecision"
      @close-result="handleCloseResult"
      @close="handleCloseEvent"
    />
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import islandsData from '@/assets/data/islands.json'
import eventsData from '@/assets/data/events.json'
import bossesData from '@/assets/data/bosses.json'
import { generateIslandOptions } from '@/engine/simulation/MapGenerator.js'
import { resolveOutcome } from '@/engine/simulation/EventResolver.js'
import { useGameStore } from '@/stores/gameStore.js'
import MapCanvas from '@/components/map/MapCanvas.vue'
import EventModal from '@/components/events/EventModal.vue'

const router = useRouter()
const gameStore = useGameStore()

const eventById = new Map(eventsData.map((event) => [event.id, event]))
const bossById = new Map(bossesData.map((boss) => [boss.id, boss]))

const islands = ref([])
const selectedIslandId = ref('')
const showResult = ref(false)
const selectedOutcome = ref(null)
const resultTitle = ref('')
const resultContent = ref('')

function mapVisualType(island) {
  const id = (island.id || '').toLowerCase()

  if (id.includes('bosque')) return 'forest'
  if (id.includes('desert') || id.includes('desertica')) return 'desert'
  if (id.includes('playa')) return 'forest'
  if (id.includes('rock')) return 'rock'
  if (island.type === 'shop') return 'shop'
  if (island.type === 'boss') return 'boss'
  if (island.type === 'final') return 'final'

  return 'forest'
}

function createFallbackEvent(island) {
  return {
    id: `fallback-${island.id}`,
    title: island.name,
    description: `Has llegado a ${island.name}. Algo sucede...`,
    biome: island.type,
    allowedIslandIds: [island.id],
    decisions: [
      {
        text: 'Volver al barco',
        outcomes: [
          {
            id: `fallback-${island.id}-end`,
            weight: 100,
            type: 'end',
          },
        ],
      },
    ],
  }
}

function refreshIslandOptions(previousIslandId = null) {
  islands.value = generateIslandOptions(islandsData, 3, previousIslandId, Math.random).map((island) => ({
    ...island,
    type: mapVisualType(island),
  }))
}

function getEventForIsland(island) {
  if (!island?.events?.length) {
    return null
  }

  for (const eventId of island.events) {
    const event = eventById.get(eventId)

    if (event && !event.isContinuation) {
      return event
    }
  }

  return null
}

function getBossForIsland(island) {
  if (!island) {
    return null
  }

  if (island.bossId && bossById.has(island.bossId)) {
    return bossById.get(island.bossId)
  }

  if (island.type === 'final') {
    return bossesData.find((boss) => boss.isMajor) ?? bossesData[0] ?? null
  }

  if (island.type === 'boss') {
    return bossesData.find((boss) => boss.id === island.bossId) ?? bossesData[0] ?? null
  }

  return null
}

function describeOutcome(outcome) {
  const parts = []

  if (typeof outcome?.hpGain === 'number' && outcome.hpGain > 0) {
    parts.push(`+${outcome.hpGain} de vida`)
  }

  if (typeof outcome?.hpLoss === 'number' && outcome.hpLoss > 0) {
    parts.push(`-${outcome.hpLoss} de vida`)
  }

  if (typeof outcome?.maxHpGain === 'number' && outcome.maxHpGain > 0) {
    parts.push(`+${outcome.maxHpGain} de vida máxima`)
  }

  if (typeof outcome?.lootGain === 'number' && outcome.lootGain > 0) {
    parts.push(`+${outcome.lootGain} de loot`)
  }

  if (typeof outcome?.lootLoss === 'number' && outcome.lootLoss > 0) {
    parts.push(`-${outcome.lootLoss} de loot`)
  }

  if (outcome?.itemName) {
    parts.push(`Objeto: ${outcome.itemName}`)
  }

  if (outcome?.setFlag) {
    parts.push(`Marca: ${outcome.setFlag}`)
  }

  return parts.length > 0 ? parts.join(' · ') : 'No ocurre nada destacado.'
}

function buildResultData(decision, outcome) {
  const followupEvent = outcome?.nextEventId ? eventById.get(outcome.nextEventId) : null

  if (followupEvent) {
    return {
      title: followupEvent.title,
      content: followupEvent.description,
    }
  }

  return {
    title: decision.text,
    content: describeOutcome(outcome),
  }
}

function resetEventState({ regenerateMap = true, previousIslandId = null } = {}) {
  showResult.value = false
  selectedOutcome.value = null
  resultTitle.value = ''
  resultContent.value = ''
  selectedIslandId.value = ''
  gameStore.currentIsland = null
  gameStore.setCurrentEvent(null)

  if (regenerateMap) {
    refreshIslandOptions(previousIslandId)
  }
}

function navigateToIsland(island) {
  selectedIslandId.value = island.id

  if (island.type === 'boss' || island.type === 'final') {
    const boss = getBossForIsland(island)

    if (boss) {
      gameStore.enterCombat(boss)
    } else {
      gameStore.currentPhase = 'combat'
    }

    gameStore.currentIsland = island
    gameStore.setCurrentEvent(null)
    router.push({ name: 'combat' })
    return
  }

  const selectedEvent = getEventForIsland(island) ?? createFallbackEvent(island)

  gameStore.currentIsland = island
  gameStore.setCurrentEvent(selectedEvent)
  showResult.value = false
  selectedOutcome.value = null
  resultTitle.value = ''
  resultContent.value = ''
}

function handleSelectDecision(optionIndex) {
  const currentEvent = gameStore.currentEvent
  const decision = currentEvent?.decisions?.[optionIndex]

  if (!decision) {
    return
  }

  const outcome = resolveOutcome(decision.outcomes || [])

  if (outcome?.type === 'end' && !outcome?.nextEventId) {
    resetEventState({ regenerateMap: true, previousIslandId: gameStore.currentIsland?.id ?? null })
    return
  }

  selectedOutcome.value = outcome ?? null
  const data = buildResultData(decision, outcome)
  resultTitle.value = data.title
  resultContent.value = data.content
  showResult.value = true
}

function handleCloseResult() {
  resetEventState({ regenerateMap: true, previousIslandId: gameStore.currentIsland?.id ?? null })
}

function handleCloseEvent() {
  resetEventState({ regenerateMap: true, previousIslandId: gameStore.currentIsland?.id ?? null })
}

refreshIslandOptions()
</script>

<style scoped>
.map-view {
  min-height: 100vh;
  padding: 1.5rem;
  background: radial-gradient(circle at top, rgba(33, 67, 99, 0.35), rgba(4, 10, 18, 1) 60%);
  color: #e9f2fb;
}

.map-view__shell {
  width: min(1180px, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.map-view__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.1rem 0;
}

.map-view__eyebrow {
  margin: 0;
  color: #8fb0cf;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.map-view__title {
  margin: 0.2rem 0 0;
  font-size: clamp(1.7rem, 2.8vw, 2.6rem);
  line-height: 1.1;
}

.map-view__subtitle {
  max-width: 38ch;
  margin: 0;
  color: #bed0e0;
  text-align: right;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .map-view__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .map-view__subtitle {
    text-align: left;
  }
}
</style>
