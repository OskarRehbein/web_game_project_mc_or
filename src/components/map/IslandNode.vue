<template>
  <button
    type="button"
    class="island-node"
    :class="[
      `island-node--${visualType}`,
      {
        'island-node--selected': selected,
        'island-node--blocked': blocked,
        'island-node--completed': island?.isCompleted,
      },
    ]"
    :disabled="blocked || !selectable"
    @click="$emit('select', island)"
  >
    <span class="island-node__glow" />

    <span class="island-node__badge">
      {{ typeLabel }}
    </span>

    <span
      class="island-node__icon"
      aria-hidden="true"
    >
      {{ typeIcon }}
    </span>

    <span class="island-node__name">
      {{ island.name }}
    </span>

    <span class="island-node__state">
      {{ stateLabel }}
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const TYPE_LABELS = {
  forest: 'Bosque',
  desert: 'Desierto',
  rock: 'Roca',
  shop: 'Tienda',
  boss: 'Jefe',
  final: 'Final',
}

const TYPE_ICONS = {
  forest: '🌿',
  desert: '🏜️',
  rock: '🪨',
  shop: '🛒',
  boss: '👑',
  final: '⚓',
}

const props = defineProps({
  island: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  selectable: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['select'])

const visualType = computed(() => props.island?.type ?? 'forest')
const typeLabel = computed(() => TYPE_LABELS[visualType.value] ?? visualType.value)
const typeIcon = computed(() => TYPE_ICONS[visualType.value] ?? '🗺️')

const stateLabel = computed(() => {
  if (props.blocked) {
    return 'Bloqueada'
  }

  if (props.selected) {
    return 'Seleccionada'
  }

  if (props.island?.isCompleted) {
    return 'Completada'
  }

  return props.selectable ? 'Explorar' : 'No disponible'
})
</script>

<style scoped>
.island-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
  min-height: 180px;
  padding: 1rem;
  border-radius: 20px;
  border: 1px solid rgba(124, 170, 206, 0.22);
  background: linear-gradient(180deg, rgba(10, 24, 41, 0.98) 0%, rgba(6, 15, 26, 0.99) 100%);
  color: #eef5ff;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.island-node:hover:not(:disabled) {
  transform: translateY(-3px);
  border-color: rgba(232, 215, 125, 0.5);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.28);
}

.island-node:disabled {
  cursor: not-allowed;
}

.island-node--selected {
  border-color: rgba(232, 215, 125, 0.85);
  box-shadow: 0 0 0 1px rgba(232, 215, 125, 0.32), 0 18px 32px rgba(0, 0, 0, 0.3);
}

.island-node--blocked {
  opacity: 0.55;
  border-style: dashed;
}

.island-node--completed {
  background: linear-gradient(180deg, rgba(12, 30, 45, 0.98) 0%, rgba(7, 18, 28, 0.99) 100%);
}

.island-node--forest .island-node__glow {
  background: radial-gradient(circle, rgba(74, 157, 111, 0.34) 0%, rgba(74, 157, 111, 0) 72%);
}

.island-node--desert .island-node__glow {
  background: radial-gradient(circle, rgba(232, 215, 125, 0.36) 0%, rgba(232, 215, 125, 0) 72%);
}

.island-node--rock .island-node__glow {
  background: radial-gradient(circle, rgba(139, 139, 139, 0.34) 0%, rgba(139, 139, 139, 0) 72%);
}

.island-node--shop .island-node__glow {
  background: radial-gradient(circle, rgba(110, 146, 255, 0.34) 0%, rgba(110, 146, 255, 0) 72%);
}

.island-node--boss .island-node__glow,
.island-node--final .island-node__glow {
  background: radial-gradient(circle, rgba(230, 92, 92, 0.34) 0%, rgba(230, 92, 92, 0) 72%);
}

.island-node__glow {
  position: absolute;
  inset: -15% -10% auto;
  height: 120px;
  opacity: 0.65;
  pointer-events: none;
}

.island-node__badge {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: rgba(20, 34, 53, 0.86);
  border: 1px solid rgba(124, 170, 206, 0.18);
  color: #97b7d6;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.island-node__icon {
  position: relative;
  z-index: 1;
  font-size: 2rem;
  line-height: 1;
}

.island-node__name {
  position: relative;
  z-index: 1;
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.2;
}

.island-node__state {
  position: relative;
  z-index: 1;
  margin-top: auto;
  color: #d1deec;
  font-size: 0.85rem;
}
</style>
