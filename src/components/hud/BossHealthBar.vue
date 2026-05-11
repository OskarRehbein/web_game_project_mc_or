<template>
  <div
    class="boss-hp-bar"
    role="progressbar"
    :aria-valuenow="hp"
    :aria-valuemax="maxHp"
    :aria-label="'Vida de ' + bossName"
  >
    <div class="boss-hp-bar__header">
      <span class="boss-hp-bar__name">{{ bossName }}</span>
      <span class="boss-hp-bar__value">{{ hp }} / {{ maxHp }}</span>
    </div>
    <div class="boss-hp-bar__track">
      <div
        class="boss-hp-bar__fill"
        :style="{ width: fillPercent + '%' }"
      />
      <div
        v-for="marker in phaseMarkers"
        :key="marker"
        class="boss-hp-bar__phase-marker"
        :style="{ left: (100 - marker * 100) + '%' }"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

/**
 * @description Displays the current boss HP as a full-width bar with phase markers
 *              at 50% and 25% to visually indicate when new attack patterns unlock.
 *              Always visible during combat (FR-016).
 */
const props = defineProps({
  /**
   * @description Display name of the boss
   */
  bossName: {
    type: String,
    required: true,
  },
  /**
   * @description Current boss HP (≥ 0)
   */
  hp: {
    type: Number,
    required: true,
  },
  /**
   * @description Boss maximum HP (> 0)
   */
  maxHp: {
    type: Number,
    required: true,
  },
})

/**
 * @description HP fill percentage clamped to [0, 100].
 * @returns {number}
 */
const fillPercent = computed(() => Math.max(0, Math.min(100, (props.hp / props.maxHp) * 100)))

/**
 * @description Phase threshold markers drawn on the bar (at 0.5 and 0.25 of maxHp).
 *              These correspond to hpThreshold values in boss attack patterns.
 * @returns {number[]}
 */
const phaseMarkers = [0.5, 0.25]
</script>

<style scoped>
.boss-hp-bar {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.boss-hp-bar__header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 700;
  color: #e8e8f0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.boss-hp-bar__name { color: #ff6b35; }

.boss-hp-bar__track {
  position: relative;
  height: 14px;
  background: #1a1a2e;
  border: 1px solid #555;
  border-radius: 3px;
  overflow: hidden;
}

.boss-hp-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #aa1111 0%, #ee3322 100%);
  transition: width 0.25s ease;
}

.boss-hp-bar__phase-marker {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255, 255, 100, 0.7);
}
</style>
