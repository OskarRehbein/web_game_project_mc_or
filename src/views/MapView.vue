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
      :options="eventData.options"
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
import { useRouter } from 'vue-router'
import { Island } from '@/engine/entities/Island.js'
import { Ship } from '@/engine/entities/Ship.js'
import islandsData from '@/assets/data/islands.json'
import eventsData from '@/assets/data/events.json'
import bossesData from '@/assets/data/bosses.json'
import { generateIslandOptions } from '@/engine/simulation/MapGenerator.js'
import { resolveOutcome } from '@/engine/simulation/EventResolver.js'
import EventWindow from '@/components/EventWindow.vue'
import { useGameStore } from '@/stores/gameStore.js'

// Referencias
const mapCanvas = ref(null)
const router = useRouter()
const gameStore = useGameStore()

const eventById = new Map(eventsData.map((event) => [event.id, event]))
const bossById = new Map(bossesData.map((boss) => [boss.id, boss]))

// Estado de eventos
const showEventWindow = ref(false)
const eventData = ref({
  title: 'Evento 1',
  content: 'Párrafo de prueba',
  options: [],
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
let activeEvent = null

const SHIP_SPEED = 3 //dejar en 1.3 // píxeles por frame
let animationFrameId = null

/**
 * Inicializa las islas con posiciones fijas
 */
function mapVisualType(island) {
  // Map semantic island ids/names to visual types expected by Island.getColor()
  const id = (island.id || '').toLowerCase()
  if (id.includes('bosque')) return 'forest'
  if (id.includes('desert') || id.includes('desertica')) return 'desert'
  if (id.includes('playa')) return 'forest'
  if (id.includes('rock')) return 'rock'
  if (island.type === 'shop') return 'rock'
  if (island.type === 'boss') return 'rock'
  return 'forest'
}

function initializeIslands() {
  // choose three island options from the bank
  const options = generateIslandOptions(islandsData, 3, null, Math.random)

  // helper: distance between two points
  function dist(a, b) {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  const center = { x: canvasWidth / 2, y: canvasHeight / 2 }
  const margin = 60
  const minDistanceFromShip = 160 // px minimal distance from ship center
  const minDistanceBetweenIslands = 120

  const placed = []

  // generate random positions for each chosen island
  for (let i = 0; i < options.length; i++) {
    const opt = options[i]
    let attempt = 0
    let pos = { x: margin + Math.random() * (canvasWidth - margin * 2), y: margin + Math.random() * (canvasHeight - margin * 2) }

    while (attempt < 200) {
      // sample position
      // Restrict horizontal sampling to avoid first and last quarter of the canvas
      const allowedXMin = Math.max(margin, Math.floor(canvasWidth * 0.25))
      const allowedXMax = Math.min(canvasWidth - margin, Math.ceil(canvasWidth * 0.75))
      const sampleX = allowedXMin + Math.random() * Math.max(0, allowedXMax - allowedXMin)
      const sampleY = margin + Math.random() * Math.max(0, canvasHeight - margin * 2)
      pos = { x: sampleX, y: sampleY }

      // avoid proximity to ship center
      if (dist(pos, center) < minDistanceFromShip) {
        attempt++
        continue
      }

      // avoid overlapping previously placed islands
      let ok = true
      for (const p of placed) {
        if (dist(pos, p) < minDistanceBetweenIslands) {
          ok = false
          break
        }
      }

      if (!ok) {
        attempt++
        continue
      }

      break
    }

    placed.push(pos)

    const visualType = mapVisualType(opt)
    islands.push(
      new Island({
        id: opt.id,
        name: opt.name,
        type: visualType,
        events: opt.events || [],
        x: pos.x,
        y: pos.y,
        radius: 25,
        interactionRadius: 80,
      })
    )
  }

  console.warn('Islas inicializadas (desde assets):', islands)
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

function resetExplorationMap() {
  islands = []
  currentIslandInRange = null
  activeEvent = null
  keysPressed = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    ' ': false,
  }

  initializeIslands()
  initializeShip()
  drawMap()
}

function getEventForIsland(island) {
  if (!island?.events?.length) {
    return null
  }

  for (const eventId of island.events) {
    const event = eventById.get(eventId)

    if (event && !event.isContinuation) {
      return event
    }
  }

  return null
}

function describeOutcome(outcome) {
  const parts = []

  if (typeof outcome?.hpGain === 'number' && outcome.hpGain > 0) {
    parts.push(`+${outcome.hpGain} de vida`)
  }

  if (typeof outcome?.maxHpGain === 'number' && outcome.maxHpGain > 0) {
    parts.push(`+${outcome.maxHpGain} de vida máxima`)
  }

  if (typeof outcome?.lootGain === 'number' && outcome.lootGain > 0) {
    parts.push(`+${outcome.lootGain} de loot`)
  }

  if (typeof outcome?.lootLoss === 'number' && outcome.lootLoss > 0) {
    parts.push(`-${outcome.lootLoss} de loot`)
  }

  if (outcome?.itemName) {
    parts.push(`Objeto: ${outcome.itemName}`)
  }

  if (outcome?.setFlag) {
    parts.push(`Marca: ${outcome.setFlag}`)
  }

  return parts.length > 0 ? parts.join(' · ') : 'No ocurre nada destacado.'
}

function buildResultData(decision, outcome) {
  const followupEvent = outcome?.nextEventId ? eventById.get(outcome.nextEventId) : null

  if (followupEvent) {
    return {
      title: followupEvent.title,
      content: followupEvent.description,
    }
  }

  return {
    title: decision.text,
    content: describeOutcome(outcome),
  }
}

function endCurrentEvent() {
  showResultWindow.value = false
  showEventWindow.value = false
  eventData.value.options = []
  resultData.value = {
    title: 'Resultado',
    content: 'Placeholder',
  }
  activeEvent = null
  gameStore.currentIsland = null
  gameStore.setCurrentEvent(null)
  resetExplorationMap()
}

function goToCombat(bossId) {
  const boss = bossById.get(bossId) ?? bossesData[0] ?? null

  if (!boss) {
    return
  }

  showResultWindow.value = false
  showEventWindow.value = false
  activeEvent = null
  gameStore.currentIsland = currentIslandInRange
  gameStore.enterCombat(boss)
  router.push({ name: 'combat' })
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
    const selectedEvent = getEventForIsland(currentIslandInRange)

    if (!selectedEvent) {
      showEventWindow.value = true
      showResultWindow.value = false
      eventData.value.title = currentIslandInRange.name
      eventData.value.content = `Has llegado a ${currentIslandInRange.name}. Algo sucede...`
      eventData.value.options = ['Volver al barco']
      activeEvent = null
      gameStore.setCurrentEvent(null)
      return
    }

    activeEvent = selectedEvent
    gameStore.currentIsland = currentIslandInRange
    gameStore.setCurrentEvent(selectedEvent)
    showEventWindow.value = true
    showResultWindow.value = false
    eventData.value.title = selectedEvent.title
    eventData.value.content = selectedEvent.description
    eventData.value.options = (selectedEvent.decisions || []).map((decision) => decision.text)
  }
}

/**
 * Maneja la selección de una opción del evento
 */
function handleSelectOption(optionIndex) {
  console.warn(`Opción seleccionada: ${optionIndex + 1}`)
  const currentEvent = activeEvent

  if (!currentEvent?.decisions?.[optionIndex]) {
    return
  }

  const decision = currentEvent.decisions[optionIndex]
  const outcome = resolveOutcome(decision.outcomes || [])

  if (outcome?.type === 'boss') {
    goToCombat(outcome.bossId)
    return
  }

  if (outcome?.type === 'end' && !outcome?.nextEventId) {
    endCurrentEvent()
    return
  }

  showResultWindow.value = true
  showEventWindow.value = true
  resultData.value = buildResultData(decision, outcome)
}

/**
 * Cierra la ventana de resultado
 */
function handleCloseResult() {
  endCurrentEvent()
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

  // Dibujar nombres de islas debajo de cada punto
  if (islands.length > 0) {
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (const island of islands) {
      const labelY = island.y + island.radius + 6

      // Outline for readability
      ctx.lineWidth = 3
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'
      ctx.strokeText(island.name, island.x, labelY)

      // Fill text
      ctx.fillStyle = 'rgba(232, 215, 125, 1)'
      ctx.fillText(island.name, island.x, labelY)
    }
  }

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
