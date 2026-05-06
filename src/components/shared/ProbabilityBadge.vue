<script setup>
/**
 * @description Displays a weighted probability as a readable percentage badge.
 *              Used in DecisionCard to show outcome odds to the player (SC-003, FR-026).
 *              The displayed percentage matches exactly the weight defined in the event data.
 *
 * @prop {number} weight - Raw weight value (0–100); displayed as "N%" label
 * @prop {'loot'|'trap'|'boss'|'damage'|'debuff'|'subevent'} [type='loot'] - Outcome type for color coding
 */
defineProps({
  weight: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    default: 'loot',
    validator: (v) => ['loot', 'trap', 'boss', 'damage', 'debuff', 'subevent'].includes(v),
  },
})

/** @description Maps outcome type to an emoji icon for quick visual recognition */
const ICONS = {
  loot: '💰',
  trap: '⚠️',
  boss: '💀',
  damage: '🩸',
  debuff: '🌀',
  subevent: '🔀',
}
</script>

<template>
  <span :class="['prob-badge', `prob-badge--${type}`]" :title="`${weight}% de probabilidad`">
    {{ ICONS[type] }} {{ weight }}%
  </span>
</template>

<style scoped>
.prob-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}
.prob-badge--loot    { background: #1e4d2b; color: #6fcf97; }
.prob-badge--trap    { background: #4d3a00; color: #f2c94c; }
.prob-badge--boss    { background: #3d0f0f; color: #eb5757; }
.prob-badge--damage  { background: #4d1a1a; color: #f87171; }
.prob-badge--debuff  { background: #1f1a4d; color: #a78bfa; }
.prob-badge--subevent { background: #1a3a4d; color: #60c8f5; }
</style>
