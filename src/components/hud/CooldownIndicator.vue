<template>
  <div class="cooldown" :class="{ 'cooldown--ready': isReady, 'cooldown--active': !isReady }">
    <div class="cooldown__icon-wrap">
      <span class="cooldown__icon">⚡</span>
      <svg class="cooldown__ring" viewBox="0 0 36 36">
        <circle class="cooldown__ring-bg" cx="18" cy="18" r="15" />
        <circle
          class="cooldown__ring-fill"
          cx="18" cy="18" r="15"
          :stroke-dasharray="`${progressArc} 94.25`"
        />
      </svg>
    </div>
    <div class="cooldown__info">
      <span class="cooldown__name">{{ cardName }}</span>
      <span class="cooldown__status">{{ isReady ? 'Listo' : remainingLabel }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

/**
 * @description Displays the cooldown state for an Action card.
 *              Shows a circular progress ring that fills as the cooldown expires,
 *              and a "Listo" label when the card is available (FR-007, FR-020).
 */
const props = defineProps({
  /**
   * @description Display name of the Action card
   */
  cardName: {
    type: String,
    required: true,
  },
  /**
   * @description Total cooldown duration in seconds (> 0)
   */
  cooldownTotal: {
    type: Number,
    required: true,
  },
  /**
   * @description Remaining cooldown in seconds (0 = card is ready)
   */
  cooldownRemaining: {
    type: Number,
    default: 0,
  },
})

/**
 * @description Whether the card is ready to use (remaining cooldown is 0).
 * @returns {boolean}
 */
const isReady = computed(() => props.cooldownRemaining <= 0)

/**
 * @description Arc length for the SVG ring, proportional to how much cooldown has elapsed.
 *              Full circle circumference ≈ 94.25 (2π × 15).
 * @returns {number}
 */
const progressArc = computed(() => {
  if (props.cooldownTotal <= 0) return 94.25
  const elapsed = props.cooldownTotal - props.cooldownRemaining
  return Math.min(94.25, (elapsed / props.cooldownTotal) * 94.25)
})

/**
 * @description Human-readable remaining time label (e.g. "2.5s").
 * @returns {string}
 */
const remainingLabel = computed(() => `${props.cooldownRemaining.toFixed(1)}s`)
</script>

<style scoped>
.cooldown {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 6px 10px;
  min-width: 120px;
  transition: border-color 0.2s;
}

.cooldown--ready  { border-color: #44cc44; }
.cooldown--active { border-color: #444; }

.cooldown__icon-wrap {
  position: relative;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.cooldown__icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  z-index: 1;
}

.cooldown__ring {
  position: absolute;
  inset: 0;
  width: 36px;
  height: 36px;
  transform: rotate(-90deg);
}

.cooldown__ring-bg {
  fill: none;
  stroke: #333;
  stroke-width: 3;
}

.cooldown__ring-fill {
  fill: none;
  stroke: #44cc44;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.1s linear;
}

.cooldown--active .cooldown__ring-fill { stroke: #ffaa00; }

.cooldown__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cooldown__name {
  font-size: 12px;
  font-weight: 600;
  color: #e8e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}

.cooldown__status {
  font-size: 11px;
  color: #aaa;
}

.cooldown--ready .cooldown__status { color: #44cc44; font-weight: 700; }
</style>
