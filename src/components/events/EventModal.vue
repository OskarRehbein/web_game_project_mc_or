<template>
  <div
    class="event-modal__backdrop"
    @click.self="$emit('close')"
  >
    <section class="event-modal">
      <header class="event-modal__header">
        <div>
          <p class="event-modal__eyebrow">
            {{ eventTag }}
          </p>
          <h2 class="event-modal__title">
            {{ event.title }}
          </h2>
        </div>

        <button
          type="button"
          class="event-modal__close"
          @click="$emit('close')"
        >
          Cerrar
        </button>
      </header>

      <p
        v-if="!showResult"
        class="event-modal__description"
      >
        {{ event.description }}
      </p>

      <OutcomeDisplay
        v-else-if="selectedOutcome"
        :outcome="selectedOutcome"
        :title="resultTitle || selectedOutcomeLabel"
        :content="resultContent"
      />

      <div
        v-else-if="showResult"
        class="event-modal__result-fallback"
      >
        <h3 class="event-modal__result-title">
          {{ resultTitle || 'Resultado' }}
        </h3>
        <p class="event-modal__result-content">
          {{ resultContent || 'No ocurre nada destacado.' }}
        </p>
      </div>

      <div
        v-if="!showResult"
        class="event-modal__decisions"
      >
        <DecisionCard
          v-for="(decision, index) in decisions"
          :key="decision.id ?? `${event.id}-${index}`"
          :decision="decision"
          :index="index"
          :blocked="isDecisionBlocked(decision)"
          :blocked-reason="getBlockedReason(decision)"
          @select="$emit('select-decision', $event)"
        />

        <p
          v-if="!decisions.length"
          class="event-modal__empty"
        >
          Este evento no tiene decisiones disponibles.
        </p>
      </div>

      <div
        v-else
        class="event-modal__actions"
      >
        <button
          type="button"
          class="event-modal__primary-action"
          @click="$emit('close-result')"
        >
          Continuar
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDeckStore } from '@/stores/deckStore.js'
import DecisionCard from './DecisionCard.vue'
import OutcomeDisplay from './OutcomeDisplay.vue'

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  showResult: {
    type: Boolean,
    default: false,
  },
  selectedOutcome: {
    type: Object,
    default: null,
  },
  resultTitle: {
    type: String,
    default: '',
  },
  resultContent: {
    type: String,
    default: '',
  },
})

defineEmits(['select-decision', 'close-result', 'close'])

const deckStore = useDeckStore()

const decisions = computed(() => Array.isArray(props.event?.decisions) ? props.event.decisions : [])
const utilityCardCount = computed(() => deckStore.utilityCards.length)
const eventTag = computed(() => props.event?.biome ? props.event.biome.toUpperCase() : 'EVENTO')
const selectedOutcomeLabel = computed(() => props.selectedOutcome?.label ?? props.selectedOutcome?.type ?? 'Resultado')

function requiresUtilityCard(decision) {
  const requirements = Array.isArray(decision?.requirements) ? decision.requirements : []

  return requirements.some((requirement) => {
    if (typeof requirement === 'string') {
      return requirement.toLowerCase().includes('utility')
    }

    if (!requirement || typeof requirement !== 'object') {
      return false
    }

    return (
      requirement.type === 'utility'
      || requirement.cardType === 'utility'
      || requirement.category === 'utility'
      || requirement.requiresUtility === true
      || requirement.requiresUtilityCard === true
    )
  })
}

function isDecisionBlocked(decision) {
  return requiresUtilityCard(decision) && utilityCardCount.value === 0
}

function getBlockedReason(decision) {
  if (!isDecisionBlocked(decision)) {
    return ''
  }

  return 'Necesitas al menos una carta de Utilidad para elegir esta opción.'
}
</script>

<style scoped>
.event-modal__backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(1, 8, 18, 0.72);
  backdrop-filter: blur(6px);
  z-index: 1000;
}

.event-modal {
  width: min(860px, 100%);
  max-height: min(88vh, 920px);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 24px;
  border: 1px solid rgba(124, 170, 206, 0.22);
  background: linear-gradient(180deg, rgba(12, 24, 41, 0.98) 0%, rgba(7, 15, 26, 0.99) 100%);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.02) inset;
  overflow: hidden;
}

.event-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.event-modal__eyebrow {
  margin: 0;
  color: #8fb0cf;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.event-modal__title {
  margin: 0.2rem 0 0;
  color: #f5f7fa;
  font-size: clamp(1.35rem, 2vw, 2rem);
  line-height: 1.15;
}

.event-modal__close {
  border: 1px solid rgba(124, 170, 206, 0.28);
  border-radius: 999px;
  padding: 0.65rem 1rem;
  background: rgba(20, 34, 53, 0.95);
  color: #d4e1ef;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.event-modal__close:hover {
  transform: translateY(-1px);
  border-color: rgba(232, 215, 125, 0.55);
}

.event-modal__description {
  margin: 0;
  color: #c5d5e6;
  line-height: 1.65;
  font-size: 0.98rem;
}

.event-modal__decisions {
  display: grid;
  gap: 0.8rem;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.event-modal__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
}

.event-modal__primary-action {
  border: 1px solid rgba(232, 215, 125, 0.32);
  border-radius: 999px;
  padding: 0.75rem 1.15rem;
  background: linear-gradient(180deg, rgba(232, 215, 125, 0.16) 0%, rgba(232, 215, 125, 0.08) 100%);
  color: #f6eaa8;
  font-weight: 700;
  cursor: pointer;
}

.event-modal__result-fallback {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.event-modal__result-title {
  margin: 0;
  color: #f5f7fa;
  font-size: 1.1rem;
}

.event-modal__result-content {
  margin: 0;
  color: #c5d5e6;
  line-height: 1.6;
}

.event-modal__empty {
  margin: 0;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  background: rgba(30, 47, 70, 0.7);
  border: 1px dashed rgba(124, 170, 206, 0.25);
  color: #b9cbdc;
}
</style>
