<template>
  <div class="gold-counter" title="Oro del jugador">
    <span class="gold-counter__icon">💰</span>
    <span class="gold-counter__amount">{{ playerStore.gold }}</span>
  </div>
</template>

<script setup>
import { usePlayerStore } from '@/stores/playerStore'

/**
 * @description Muestra el oro actual del jugador reactivamente.
 */
const playerStore = usePlayerStore()
</script>

<style scoped>
.gold-counter {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.5);
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  font-family: monospace;
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 1px 1px 2px #000;
}

.gold-counter__icon {
  font-size: 18px;
}
</style>
