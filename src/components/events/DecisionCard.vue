<template>
  <button
    type="button"
    class="decision-card"
    :class="{
      'decision-card--blocked': blocked,
      'decision-card--selected': selected,
    }"
    :disabled="blocked"
    @click="$emit('select', index)"
  >
    <div class="decision-card__header">
      <span class="decision-card__index">{{ index + 1 }}</span>
      <span class="decision-card__icon">{{ decisionIcon }}</span>
      <div class="decision-card__titles">
        <h3 class="decision-card__title">
          {{ decision.text }}
        </h3>
        <p
          v-if="blocked"
          class="decision-card__blocker"
        >
          {{ blockedReason || 'Requiere una carta de Utilidad' }}
        </p>
      </div>
    </div>

    <p
      v-if="decision.description"
      class="decision-card__description"
    >
      {{ decision.description }}
    </p>

    <div
      v-if="outcomeSummaries.length"
      class="decision-card__probabilities"
    >
      <span
        v-for="outcome in outcomeSummaries"
        :key="outcome.id"
        class="decision-card__badge"
      >
        <span class="decision-card__badge-icon">{{ outcome.icon }}</span>
        <span class="decision-card__badge-text">{{ outcome.label }}</span>
        <span class="decision-card__badge-weight">{{ outcome.percent }}%</span>
      </span>
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const OUTCOME_ICONS = {
  combat: '⚔️',
  boss: '👑',
  loot: '💰',
  loot_loss: '📉',
  debuff: '☠️',
  subevent: '➜',
  end: '✓',
}

const props = defineProps({
  decision: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    default: 0,
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  blockedReason: {
    type: String,
    default: '',
  },
  selected: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select'])

const decisionIcon = computed(() => {
  if (props.decision?.icon) {
    return props.decision.icon
  }

  const firstOutcomeType = props.decision?.outcomes?.[0]?.type
  return OUTCOME_ICONS[firstOutcomeType] ?? '🃏'
})

const outcomeSummaries = computed(() => {
  const outcomes = Array.isArray(props.decision?.outcomes) ? props.decision.outcomes : []
  const totalWeight = outcomes.reduce((sum, outcome) => sum + (Number(outcome.weight) || 0), 0)

  return outcomes.map((outcome) => {
    const weight = Number(outcome.weight) || 0
    const percent = totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : weight

    return {
      id: outcome.id ?? `${props.index}-${outcome.type ?? 'outcome'}`,
      icon: OUTCOME_ICONS[outcome.type] ?? '•',
      label: outcome.label ?? outcome.type ?? 'resultado',
      percent,
    }
  })
})
</script>

<style scoped>
.decision-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  border-radius: 16px;
  border: 1px solid rgba(124, 170, 206, 0.25);
  background: linear-gradient(180deg, rgba(13, 27, 45, 0.95) 0%, rgba(8, 18, 31, 0.98) 100%);
  color: #e8f0fa;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
}

.decision-card:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(232, 215, 125, 0.55);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);
}

.decision-card:disabled {
  cursor: not-allowed;
}

.decision-card--blocked {
  opacity: 0.6;
  border-style: dashed;
}

.decision-card--selected {
  border-color: rgba(232, 215, 125, 0.85);
  box-shadow: 0 0 0 1px rgba(232, 215, 125, 0.28), 0 16px 28px rgba(0, 0, 0, 0.3);
}

.decision-card__header {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.decision-card__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: rgba(232, 215, 125, 0.12);
  color: #e8d77d;
  font-weight: 800;
}

.decision-card__icon {
  font-size: 1.2rem;
  line-height: 1;
  margin-top: 0.15rem;
}

.decision-card__titles {
  flex: 1;
}

.decision-card__title {
  margin: 0;
  font-size: 1rem;
  line-height: 1.25;
  font-weight: 700;
}

.decision-card__blocker {
  margin: 0.35rem 0 0;
  color: #f7c86b;
  font-size: 0.82rem;
}

.decision-card__description {
  margin: 0;
  color: #b5c7db;
  font-size: 0.9rem;
  line-height: 1.5;
}

.decision-card__probabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.decision-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.55rem;
  border-radius: 999px;
  background: rgba(30, 47, 70, 0.9);
  border: 1px solid rgba(124, 170, 206, 0.22);
  font-size: 0.75rem;
  color: #d6e5f7;
}

.decision-card__badge-icon {
  font-size: 0.9rem;
}

.decision-card__badge-weight {
  color: #e8d77d;
  font-weight: 700;
}
</style>
