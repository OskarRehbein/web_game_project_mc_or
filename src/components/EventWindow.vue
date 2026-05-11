<template>
  <div class="event-overlay">
    <!-- Ventana de evento -->
    <div
      v-if="!showResult"
      class="event-window"
    >
      <h1 class="event-title">
        {{ title }}
      </h1>
      <div class="event-body">
        {{ content }}
      </div>

      <!-- Opciones de interacción -->
      <div class="event-options">
        <button
          v-for="(option, index) in options"
          :key="index"
          class="option-button"
          @click="$emit('select-option', index)"
        >
          {{ index + 1 }}.- {{ option }}
        </button>
      </div>
    </div>

    <!-- Ventana de resultado -->
    <div
      v-else
      class="event-window result-window"
    >
      <h1 class="event-title">
        {{ resultTitle }}
      </h1>
      <div class="event-body">
        {{ resultContent }}
      </div>
      <div class="result-actions">
        <button
          class="option-button"
          @click="$emit('close-result')"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['select-option', 'close-result'])

defineProps({
  title: {
    type: String,
    default: 'Evento 1',
  },
  content: {
    type: String,
    default: 'Párrafo de prueba',
  },
  options: {
    type: Array,
    default: () => ['Opción 1', 'Opción 2', 'Opción 3'],
  },
  showResult: {
    type: Boolean,
    default: false,
  },
  resultTitle: {
    type: String,
    default: 'Resultado',
  },
  resultContent: {
    type: String,
    default: 'Placeholder',
  },
})
</script>

<style scoped>
.event-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.event-window {
  width: 80%;
  max-width: 600px;
  background: linear-gradient(135deg, #1a2a3a 0%, #0f1a2a 100%);
  border: 2px solid #4a7fa5;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(74, 127, 165, 0.3);
  max-height: 80vh;
  overflow-y: auto;
}

.result-window {
  z-index: 1001;
}

.event-title {
  text-align: center;
  color: #e8d77d;
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 20px 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.event-body {
  text-align: justify;
  color: #b0c4de;
  font-size: 14px;
  line-height: 1.6;
  font-family: 'Arial', sans-serif;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 20px;
}

.event-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

.option-button {
  text-align: left;
  background: transparent;
  border: none;
  color: #b0c4de;
  padding: 12px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Arial', sans-serif;
}

.option-button:hover {
  color: #e8d77d;
  text-shadow: 0 0 10px rgba(232, 215, 125, 0.5);
  transform: translateX(5px);
}

.option-button:active {
  transform: translateX(3px);
}

.result-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 20px;
}

</style>
