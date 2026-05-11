<template>
  <div
    class="health-bar"
    :class="urgencyClass"
    role="progressbar"
    :aria-valuenow="hp"
    :aria-valuemax="maxHp"
    aria-label="Vida del jugador"
  >
    <div class="health-bar__label">
      <span class="health-bar__icon">❤️</span>
      <span class="health-bar__text">{{ hp }} / {{ maxHp }}</span>
    </div>
    <div class="health-bar__track">
      <div
        class="health-bar__fill"
        :style="{ width: fillPercent + '%' }"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

/**
 * @description Displays the player's current HP as a horizontal bar with numeric label.
 *              Changes colour as HP drops (green → yellow → red) to signal urgency (FR-017).
 */
const props = defineProps({
  /**
   * @description Current HP value of the player (≥ 0)
   */
  hp: {
    type: Number,
    required: true,
  },
  /**
   * @description Maximum HP value of the player (> 0)
   */
  maxHp: {
    type: Number,
    required: true,
  },
})

/**
 * @description Computes the fill percentage clamped to [0, 100].
 * @returns {number} Percentage from 0 to 100
 */
const fillPercent = computed(() => Math.max(0, Math.min(100, (props.hp / props.maxHp) * 100)))

/**
 * @description Returns a CSS class based on HP ratio to drive colour changes.
 * @returns {string} 'health-bar--critical' | 'health-bar--low' | ''
 */
const urgencyClass = computed(() => {
  const ratio = props.hp / props.maxHp
  if (ratio <= 0.25) return 'health-bar--critical'
  if (ratio <= 0.5)  return 'health-bar--low'
  return ''
})
</script>

<style scoped>
.health-bar {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 160px;
}

.health-bar__label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #e8e8f0;
}

.health-bar__icon { font-size: 14px; }

.health-bar__track {
  height: 10px;
  background: #222;
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid #444;
}

.health-bar__fill {
  height: 100%;
  background: #44cc44;
  border-radius: 5px;
  transition: width 0.2s ease, background 0.3s ease;
}

.health-bar--low    .health-bar__fill { background: #ddbb22; }
.health-bar--critical .health-bar__fill { background: #ee3322; }
</style>
