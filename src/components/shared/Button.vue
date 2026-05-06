<script setup>
/**
 * @description Reusable button component with three visual variants.
 *              Emits a 'click' event when pressed (unless disabled).
 *              Used across all views for consistent interaction styling.
 *
 * @prop {'primary'|'secondary'|'danger'} [variant='primary'] - Visual style variant
 * @prop {boolean} [disabled=false] - When true, button is non-interactive and visually muted
 */
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'danger'].includes(v),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])
</script>

<template>
  <button
    :class="['btn', `btn--${variant}`, { 'btn--disabled': disabled }]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<style scoped>
.btn {
  padding: 0.6rem 1.4rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  user-select: none;
}
.btn:active:not(.btn--disabled) {
  transform: scale(0.97);
}
.btn--primary {
  background: #d4a017;
  color: #1a1a2e;
}
.btn--primary:hover:not(.btn--disabled) {
  background: #e8b820;
}
.btn--secondary {
  background: #2e3a5c;
  color: #cdd6f4;
}
.btn--secondary:hover:not(.btn--disabled) {
  background: #3a4a70;
}
.btn--danger {
  background: #c0392b;
  color: #fff;
}
.btn--danger:hover:not(.btn--disabled) {
  background: #e74c3c;
}
.btn--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
