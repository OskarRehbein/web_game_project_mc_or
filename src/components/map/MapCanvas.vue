<template>
  <section class="map-canvas-panel">
    <header class="map-canvas-panel__header">
      <div>
        <p class="map-canvas-panel__eyebrow">
          Exploración
        </p>
        <h2 class="map-canvas-panel__title">
          Elige una isla
        </h2>
      </div>

      <p class="map-canvas-panel__hint">
        Selecciona una de las tres opciones disponibles.
      </p>
    </header>

    <div
      class="map-canvas-panel__grid"
      :style="gridStyle"
    >
      <IslandNode
        v-for="(island, index) in islands"
        :key="island.id ?? index"
        :island="island"
        :selected="island.id === selectedIslandId"
        :blocked="island.blocked === true"
        :selectable="island.selectable !== false"
        @select="$emit('select-island', $event)"
      />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import IslandNode from './IslandNode.vue'

const props = defineProps({
  islands: {
    type: Array,
    default: () => [],
  },
  selectedIslandId: {
    type: String,
    default: '',
  },
  columns: {
    type: Number,
    default: 3,
  },
})

defineEmits(['select-island'])

const gridStyle = computed(() => ({
  '--map-grid-columns': Math.max(1, props.columns),
}))
</script>

<style scoped>
.map-canvas-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.2rem;
  border-radius: 24px;
  border: 1px solid rgba(124, 170, 206, 0.18);
  background: linear-gradient(180deg, rgba(8, 18, 31, 0.94) 0%, rgba(5, 11, 20, 0.98) 100%);
  box-shadow: 0 22px 40px rgba(0, 0, 0, 0.28);
  color: #e9f2fb;
}

.map-canvas-panel__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.map-canvas-panel__eyebrow {
  margin: 0;
  color: #8fb0cf;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.map-canvas-panel__title {
  margin: 0.2rem 0 0;
  font-size: clamp(1.25rem, 2vw, 1.8rem);
  line-height: 1.15;
}

.map-canvas-panel__hint {
  margin: 0;
  color: #b8cadb;
  font-size: 0.9rem;
  max-width: 30ch;
  text-align: right;
}

.map-canvas-panel__grid {
  display: grid;
  grid-template-columns: repeat(var(--map-grid-columns), minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 900px) {
  .map-canvas-panel__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .map-canvas-panel__hint {
    text-align: left;
  }

  .map-canvas-panel__grid {
    grid-template-columns: 1fr;
  }
}
</style>
