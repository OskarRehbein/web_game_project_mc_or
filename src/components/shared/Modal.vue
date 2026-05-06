<script setup>
/**
 * @description Overlay modal component with a centered content slot.
 *              Emits 'close' when the backdrop or the close button is clicked.
 *              Used for event narratives, rewards and confirmations (FR-026).
 *
 * @prop {string} [title=''] - Optional title displayed at the top of the modal
 * @prop {boolean} [closable=true] - When false, hides the close button (for forced decisions)
 */
defineProps({
  title: {
    type: String,
    default: '',
  },
  closable: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['close'])
</script>

<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-box" role="dialog" aria-modal="true">
      <div v-if="title || closable" class="modal-header">
        <h2 v-if="title" class="modal-title">{{ title }}</h2>
        <button v-if="closable" class="modal-close" aria-label="Cerrar" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-box {
  background: #1e2140;
  border: 1px solid #3a4a70;
  border-radius: 12px;
  padding: 1.5rem;
  min-width: 340px;
  max-width: 680px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  color: #cdd6f4;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #d4a017;
  margin: 0;
}
.modal-close {
  background: none;
  border: none;
  color: #6c7a9c;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}
.modal-close:hover {
  color: #cdd6f4;
}
.modal-content {
  line-height: 1.6;
}
</style>
