<template>
  <section
    class="outcome-display"
    :class="`outcome-display--${outcomeType}`"
  >
    <header class="outcome-display__header">
      <span class="outcome-display__icon">{{ outcomeIcon }}</span>
      <div class="outcome-display__titles">
        <p class="outcome-display__eyebrow">
          {{ typeLabel }}
        </p>
        <h3 class="outcome-display__title">
          {{ displayTitle }}
        </h3>
      </div>
    </header>

    <p class="outcome-display__summary">
      {{ displaySummary }}
    </p>

    <div
      v-if="detailChips.length"
      class="outcome-display__chips"
    >
      <span
        v-for="chip in detailChips"
        :key="chip"
        class="outcome-display__chip"
      >
        {{ chip }}
      </span>
    </div>
  </section>
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

const TYPE_LABELS = {
  combat: 'Combate',
  boss: 'Jefe',
  loot: 'Botín',
  loot_loss: 'Pérdida',
  debuff: 'Debuff',
  subevent: 'Continuación',
  end: 'Final',
}

const props = defineProps({
  outcome: {
    type: Object,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    default: '',
  },
})

const outcomeType = computed(() => props.outcome?.type ?? 'end')
const outcomeIcon = computed(() => OUTCOME_ICONS[outcomeType.value] ?? '•')
const typeLabel = computed(() => TYPE_LABELS[outcomeType.value] ?? outcomeType.value)

const displayTitle = computed(() => {
  if (props.title) {
    return props.title
  }

  return props.outcome?.title ?? props.outcome?.name ?? typeLabel.value
})

const displaySummary = computed(() => {
  if (props.content) {
    return props.content
  }

  const parts = []
  const outcome = props.outcome ?? {}

  if (typeof outcome.hpGain === 'number' && outcome.hpGain > 0) {
    parts.push(`+${outcome.hpGain} de vida`)
  }

  if (typeof outcome.hpLoss === 'number' && outcome.hpLoss > 0) {
    parts.push(`-${outcome.hpLoss} de vida`)
  }

  if (typeof outcome.maxHpGain === 'number' && outcome.maxHpGain > 0) {
    parts.push(`+${outcome.maxHpGain} de vida máxima`)
  }

  if (typeof outcome.lootGain === 'number' && outcome.lootGain > 0) {
    parts.push(`+${outcome.lootGain} de loot`)
  }

  if (typeof outcome.lootLoss === 'number' && outcome.lootLoss > 0) {
    parts.push(`-${outcome.lootLoss} de loot`)
  }

  if (outcome.itemName) {
    parts.push(`Objeto: ${outcome.itemName}`)
  }

  if (outcome.bossId) {
    parts.push(`Jefe: ${outcome.bossId}`)
  }

  if (outcome.setFlag) {
    parts.push(`Marca: ${outcome.setFlag}`)
  }

  if (outcome.nextEventId) {
    parts.push(`Continúa en ${outcome.nextEventId}`)
  }

  return parts.length > 0 ? parts.join(' · ') : 'No ocurre nada destacado.'
})

const detailChips = computed(() => {
  const outcome = props.outcome ?? {}
  const chips = []

  if (outcome.weight != null) {
    chips.push(`Peso ${outcome.weight}`)
  }

  if (outcome.requiredItemId) {
    chips.push(`Requiere ${outcome.requiredItemId}`)
  }

  if (outcome.itemId) {
    chips.push(`Ítem ${outcome.itemId}`)
  }

  if (outcome.expireAfterCombat) {
    chips.push('Expira tras combate')
  }

  return chips
})
</script>

<style scoped>
.outcome-display {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem 1.1rem;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(15, 28, 47, 0.96) 0%, rgba(7, 16, 27, 0.98) 100%);
  border: 1px solid rgba(124, 170, 206, 0.25);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.outcome-display--combat,
.outcome-display--boss {
  border-color: rgba(230, 92, 92, 0.35);
}

.outcome-display--loot {
  border-color: rgba(232, 215, 125, 0.35);
}

.outcome-display--debuff {
  border-color: rgba(150, 106, 255, 0.35);
}

.outcome-display__header {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.outcome-display__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 999px;
  background: rgba(232, 215, 125, 0.12);
  font-size: 1.2rem;
}

.outcome-display__titles {
  flex: 1;
}

.outcome-display__eyebrow {
  margin: 0;
  color: #97b7d6;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.outcome-display__title {
  margin: 0.15rem 0 0;
  color: #f2f6fb;
  font-size: 1.15rem;
  line-height: 1.3;
}

.outcome-display__summary {
  margin: 0;
  color: #c7d7e8;
  line-height: 1.55;
  font-size: 0.93rem;
}

.outcome-display__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.outcome-display__chip {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  background: rgba(30, 47, 70, 0.9);
  border: 1px solid rgba(124, 170, 206, 0.2);
  color: #d6e5f7;
  font-size: 0.75rem;
}
</style>
