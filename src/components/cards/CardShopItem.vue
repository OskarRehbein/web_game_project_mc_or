<template>
  <div
    class="card-shop-item"
    :class="{ 'card-shop-item--affordable': canAfford, 'card-shop-item--locked': !canAfford }"
  >
    <CardThumbnail :card="card" />

    <div class="card-shop-item__footer">
      <span class="card-shop-item__cost">
        🪙 {{ card.cost }}
      </span>

      <button
        class="card-shop-item__buy-btn"
        :disabled="!canAfford"
        @click="onBuy"
      >
        {{ canAfford ? 'Comprar' : 'Sin oro' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePlayerStore } from '@/stores/playerStore.js'
import CardThumbnail from './CardThumbnail.vue'

const props = defineProps({
  /** @type {import('@/engine/entities/Card.js').Card} */
  card: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['buy'])

const playerStore = usePlayerStore()

/** True when the player currently has enough gold to afford this card. */
const canAfford = computed(() => playerStore.gold >= props.card.cost)

function onBuy() {
  if (!canAfford.value) return
  emit('buy', props.card)
}
</script>

<style scoped>
.card-shop-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
  border-radius: 10px;
  transition: opacity 0.2s;
}

.card-shop-item--locked {
  opacity: 0.55;
}

.card-shop-item__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.card-shop-item__cost {
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffcc44;
}

.card-shop-item__buy-btn {
  padding: 4px 14px;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  background: #2255cc;
  color: #fff;
  transition: background 0.15s;
}

.card-shop-item__buy-btn:hover:not(:disabled) {
  background: #3366ee;
}

.card-shop-item__buy-btn:disabled {
  background: #1a2a3a;
  color: #445566;
  cursor: not-allowed;
}
</style>
