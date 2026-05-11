<template>
  <main class="exploration-view">
    <div class="exploration-container">
      <canvas
        ref="mapCanvas"
        class="map-canvas"
      />
    </div>
    <!-- Ventana de eventos -->
    <EventWindow
      v-if="showEventWindow"
      :title="eventData.title"
      :content="eventData.content"
      :options="['Opción 1', 'Opción 2', 'Opción 3']"
      :show-result="showResultWindow"
      :result-title="resultData.title"
      :result-content="resultData.content"
      @select-option="handleSelectOption"
      @close-result="handleCloseResult"
    />
  </main>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Island } from '@/engine/entities/Island.js'
import { Ship } from '@/engine/entities/Ship.js'
import EventWindow from '@/components/EventWindow.vue'

// Referencias
const mapCanvas = ref(null)

// Estado de eventos
const showEventWindow = ref(false)
const eventData = ref({
  title: 'Evento 1',
  content: 'Párrafo de prueba',
})

// Estado de ventana de resultado
const showResultWindow = ref(false)
const resultData = ref({
  title: 'Resultado',
  content: 'Placeholder',
})

// Entidades del mapa
let islands = []
let ship = null
let canvasWidth = 0
let canvasHeight = 0

// Control de entrada y movimiento
let keysPressed = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  ' ': false, // barra espaciadora
}

// Rastrear isla actual en rango de interacción
let currentIslandInRange = null

const SHIP_SPEED = 1.3 // píxeles por frame
let animationFrameId = null

/**
 * Inicializa las islas con posiciones fijas
 */
function initializeIslands() {
  islands = [
    new Island({
      id: 1,
      name: 'Isla Verde',
      type: 'forest',
      x: 200,
      y: 150,
      radius: 25,
      interactionRadius: 80,
    }),
    new Island({
      id: 2,
      name: 'Isla Gris',
      type: 'rock',
      x: 600,
      y: 200,
      radius: 25,
      interactionRadius: 80,
    }),
    new Island({
      id: 3,
      name: 'Isla Amarilla',
      type: 'desert',
      x: 400,
      y: 450,
      radius: 25,
      interactionRadius: 80,
    }),
  ]
  console.warn('Islas inicializadas:', islands)
}

/**
 * Inicializa el barco en el centro del mapa
 */
function initializeShip() {
  ship = new Ship({
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    radius: 15,
  })
  console.warn('Barco inicializado:', ship)
}

/**
 * Maneja la presión de teclas
 */
function handleKeyDown(event) {
  // Detectar barra espaciadora para interacción PRIMERO
  if (event.key === ' ' && !keysPressed[' ']) {
    keysPressed[' '] = true
    handleInteraction()
    return // Evitar procesarla como otra tecla
  }

  if (event.key in keysPressed) {
    keysPressed[event.key] = true
  }
}

/**
 * Maneja la liberación de teclas
 */
function handleKeyUp(event) {
  if (event.key in keysPressed) {
    keysPressed[event.key] = false
  }
}

/**
 * Maneja la interacción cuando se presiona la barra espaciadora
 */
function handleInteraction() {
  if (currentIslandInRange) {
    console.warn(`Interactuando con: ${currentIslandInRange.name}`)
    showEventWindow.value = true
    eventData.value.title = currentIslandInRange.name
    eventData.value.content = `Has llegado a ${currentIslandInRange.name}. Algo sucede...`
  }
}

/**
 * Maneja la selección de una opción del evento
 */
function handleSelectOption(optionIndex) {
  console.warn(`Opción seleccionada: ${optionIndex + 1}`)
  showResultWindow.value = true
  resultData.value.title = 'Resultado'
  resultData.value.content = 'Placeholder'
}

/**
 * Cierra la ventana de resultado
 */
function handleCloseResult() {
  showResultWindow.value = false
  showEventWindow.value = false // Cierra también la ventana de evento
}

/**
 * Actualiza la posición del barco basado en las teclas presionadas
 */
function updateShipPosition() {
  if (!ship) return

  let newX = ship.x
  let newY = ship.y

  // Aplicar movimiento según las teclas presionadas
  if (keysPressed.ArrowUp) newY -= SHIP_SPEED
  if (keysPressed.ArrowDown) newY += SHIP_SPEED
  if (keysPressed.ArrowLeft) newX -= SHIP_SPEED
  if (keysPressed.ArrowRight) newX += SHIP_SPEED

  // Limitar el movimiento dentro del canvas
  const margin = ship.radius
  newX = Math.max(margin, Math.min(newX, canvasWidth - margin))
  newY = Math.max(margin, Math.min(newY, canvasHeight - margin))

  ship.moveTo(newX, newY)
}

/**
 * Dibuja las islas y el barco en el canvas
 */
function drawMap() {
  const canvas = mapCanvas.value
  if (!canvas) {
    console.error('Canvas no encontrado')
    return
  }

  const ctx = canvas.getContext('2d')

  // Limpiar canvas con fondo oscuro
  ctx.fillStyle = 'rgba(26, 58, 82, 1)'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Resetear isla en rango
  currentIslandInRange = null

  // Dibujar círculos de interacción primero (detrás)
  islands.forEach((island) => {
    if (ship && island.isInInteractionZone(ship.x, ship.y)) {
      currentIslandInRange = island // Rastrear isla en rango
      const color = island.getColor()
      ctx.fillStyle = `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.15)`
      ctx.beginPath()
      ctx.arc(island.x, island.y, island.interactionRadius, 0, Math.PI * 2)
      ctx.fill()

      // Borde del círculo de interacción
      ctx.strokeStyle = `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.3)`
      ctx.lineWidth = 1
      ctx.stroke()
    }
  })

  // Dibujar islas
  islands.forEach((island) => {
    const color = island.getColor()
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
    ctx.beginPath()
    ctx.arc(island.x, island.y, island.radius, 0, Math.PI * 2)
    ctx.fill()

    // Borde de la isla
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.stroke()
  })

  // Dibujar barco
  if (ship) {
    ctx.fillStyle = `#${ship.color.toString(16).padStart(6, '0')}`
    ctx.beginPath()
    ctx.arc(ship.x, ship.y, ship.radius, 0, Math.PI * 2)
    ctx.fill()

    // Borde del barco
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // Dibujar prompts de interacción
  islands.forEach((island) => {
    if (ship && island.isInInteractionZone(ship.x, ship.y)) {
      drawInteractionPrompt(ctx, island)
    }
  })
}

/**
 * Dibuja el prompt de "Interactuar" debajo de la isla (dos líneas)
 */
function drawInteractionPrompt(ctx, island) {
  const promptY = island.y + island.interactionRadius + 40
  const line1 = 'Interactuar'
  const line2 = '(Barra espaciadora)'
  const padding = 10
  const fontSize = 14
  const lineHeight = fontSize + 4

  // Configurar fuente
  ctx.font = `${fontSize}px Arial`
  const textMetrics1 = ctx.measureText(line1)
  const textMetrics2 = ctx.measureText(line2)
  const textWidth = Math.max(textMetrics1.width, textMetrics2.width)
  const boxWidth = textWidth + padding * 2
  const boxHeight = lineHeight * 2 + padding * 2
  const boxX = island.x - boxWidth / 2
  const boxY = promptY - boxHeight / 2

  // Dibujar cuadro de fondo
  ctx.fillStyle = 'rgba(74, 127, 165, 0.8)'
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight)

  // Dibujar borde del cuadro
  ctx.strokeStyle = 'rgba(232, 215, 125, 0.9)'
  ctx.lineWidth = 2
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)

  // Dibujar línea 1
  ctx.fillStyle = 'rgba(232, 215, 125, 1)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(line1, island.x, promptY - fontSize / 2)

  // Dibujar línea 2
  ctx.fillStyle = 'rgba(232, 215, 125, 0.5)'
  ctx.font = `${fontSize - 2}px Arial`
  ctx.fillText(line2, island.x, promptY + fontSize / 2 + 4)
}


/**
 * Game loop - se ejecuta cada frame
 */
function gameLoop() {
  updateShipPosition()
  drawMap()
  animationFrameId = requestAnimationFrame(gameLoop)
}

/**
 * Configura las dimensiones del canvas y dibuja el mapa
 */
function setupMap() {
  const canvas = mapCanvas.value
  const container = canvas?.parentElement

  if (!container) {
    console.error('Contenedor no encontrado')
    return
  }

  const width = container.clientWidth
  const height = container.clientHeight

  console.warn('Dimensiones del contenedor:', width, 'x', height)

  if (width === 0 || height === 0) {
    console.warn('Dimensiones son 0, reintentando en nextTick')
    return
  }

  // Asignar las dimensiones directamente al canvas
  canvas.width = width
  canvas.height = height
  canvasWidth = width
  canvasHeight = height

  console.warn('Canvas configurado a:', canvas.width, 'x', canvas.height)

  initializeIslands()
  initializeShip()
  gameLoop() // Inicia el game loop
}

onMounted(async () => {
  // Esperar a que el DOM se renderice completamente
  await nextTick()
  // Esperar un poco más para asegurar que el layout está completo
  setTimeout(setupMap, 100)

  // Agregar event listeners para el teclado
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  // Limpiar event listeners
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)

  // Cancelar el animation frame
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<style scoped>
.exploration-view {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a1434 0%, #1a0a34 100%);
  overflow: hidden;
}

.exploration-container {
  width: 90%;
  height: 90%;
  background: radial-gradient(ellipse at 50% 30%, #1a3a52, #0a0a1a);
  border: 2px solid #4a6fa5;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 0 20px rgba(0, 100, 200, 0.3);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-canvas {
  display: block;
  border-radius: 8px;
  cursor: crosshair;
  max-width: 100%;
  max-height: 100%;
}
</style>
