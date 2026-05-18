<template>
  <div
    class="card-thumbnail"
    :class="[`card-thumbnail--${card.type}`, `card-thumbnail--${card.rarity}`]"
  >
    <div class="card-thumbnail__rarity-bar" />

    <div class="card-thumbnail__header">
      <span class="card-thumbnail__type-icon">{{ typeIcon }}</span>
      <span class="card-thumbnail__name">{{ card.name }}</span>
    </div>

    <p class="card-thumbnail__desc">
      {{ card.description }}
    </p>

    <div class="card-thumbnail__footer">
      <span
        class="card-thumbnail__rarity-badge"
        :class="`card-thumbnail__rarity-badge--${card.rarity}`"
      >{{ rarityLabel }}</span>
      <span
        v-if="card.cooldown != null"
        class="card-thumbnail__cooldown"
      >⏱ {{ card.cooldown }}s</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** @type {import('@/engine/entities/Card.js').Card} */
  card: {
    type: Object,
    required: true,
  },
})

const TYPE_ICONS = {
  action: '⚡',
  passive: '🛡️',
  utility: '🔧',
  weapon: '⚔️',
  armor: '🪬',
}

const RARITY_LABELS = {
  common: 'Común',
  rare: 'Rara',
  unique: 'Única',
}

const typeIcon = computed(() => TYPE_ICONS[props.card.type] ?? '🃏')
const rarityLabel = computed(() => RARITY_LABELS[props.card.rarity] ?? props.card.rarity)
</script>

<style scoped>
.card-thumbnail {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 8px;
  background: #0d1f35;
  border: 1px solid #2a4060;
  min-width: 140px;
  max-width: 180px;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.card-thumbnail:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}

/* Rarity accent bar */
.card-thumbnail__rarity-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.card-thumbnail--common .card-thumbnail__rarity-bar  { background: #8899aa; }
.card-thumbnail--rare   .card-thumbnail__rarity-bar  { background: #6677ff; }
.card-thumbnail--unique .card-thumbnail__rarity-bar  { background: #ffaa22; }

.card-thumbnail__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.card-thumbnail__type-icon {
  font-size: 1rem;
}

.card-thumbnail__name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #e8e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-thumbnail__desc {
  font-size: 0.7rem;
  color: #99aabb;
  line-height: 1.4;
  margin: 0;
}

.card-thumbnail__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.card-thumbnail__rarity-badge {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.card-thumbnail__rarity-badge--common  { background: #2a3a4a; color: #8899aa; }
.card-thumbnail__rarity-badge--rare    { background: #1a1f50; color: #8899ff; }
.card-thumbnail__rarity-badge--unique  { background: #3a2800; color: #ffaa22; }

.card-thumbnail__cooldown {
  font-size: 0.65rem;
  color: #aabbcc;
}
</style>
