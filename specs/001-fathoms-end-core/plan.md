# Plan de Arquitectura Técnica — Fathom's End Core

**Feature Branch**: `001-fathoms-end-core`  
**Fecha**: 2026-05-04  
**Estado**: Aprobado para implementación

---

## Índice

1. [Resumen del Stack](#1-resumen-del-stack)
2. [Estructura de Carpetas](#2-estructura-de-carpetas)
3. [Integración Vue.js 3 + PixiJS](#3-integración-vuejs-3--pixijs)
4. [Puente de Comunicación PixiJS ↔ Vue / Pinia](#4-puente-de-comunicación-pixijs--vue--pinia)
5. [Stores de Pinia](#5-stores-de-pinia)
6. [Flujo de Pantallas / Router](#6-flujo-de-pantallas--router)
7. [Arquitectura del Engine (JS Puro)](#7-arquitectura-del-engine-js-puro)
8. [Diseño del Boss con AttackPattern Extensible](#8-diseño-del-boss-con-attackpattern-extensible)
9. [Sistema de Economía](#9-sistema-de-economía)
10. [Selección de Mazo Inicial (Arquetipos)](#10-selección-de-mazo-inicial-arquetipos)
11. [Probabilidad Progresiva de Eventos de Mar](#11-probabilidad-progresiva-de-eventos-de-mar)
12. [Estrategia de Pruebas](#12-estrategia-de-pruebas)

---

## 1. Resumen del Stack

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| UI / Pantallas | Vue 3 (Composition API) | Menú, Mapa, Modales, HUD, Recompensas |
| Estado global | Pinia | playerStore, gameStore, deckStore |
| Renderizado de combate | PixiJS v8 | Canvas 2D a 60 FPS, sprites, colisiones |
| Lógica pura | JavaScript ES2022 módulos | Daño, RNG, eventos, mazo — sin deps de UI |
| Router | Vue Router 4 | Navegación entre pantallas |
| Tests | Vitest | Cobertura de /engine/ y stores |
| Build | Vite | Servidor HMR + bundle producción |
| CI/CD | GitHub Actions | Lint + test en cada push |
| Deploy | Docker + Nginx | Imagen reproducible en DockerHub |

---

## 2. Estructura de Carpetas

```
/src
  /assets
    /sprites          # Spritesheets para PixiJS (jugador, jefes, FX)
    /ui               # Iconos, fuentes, CSS globales
    /data             # JSON: islands.json, bosses.json, cards.json, events.json

  /components         # Componentes Vue reutilizables (UI pura)
    /hud              # HealthBar.vue, CooldownIndicator.vue, GoldCounter.vue
    /cards            # CardThumbnail.vue, DeckViewer.vue, CardShopItem.vue
    /events           # DecisionCard.vue, EventModal.vue, OutcomeDisplay.vue
    /map              # IslandNode.vue, MapCanvas.vue
    /shared           # Button.vue, Modal.vue, ProbabilityBadge.vue

  /views              # Pantallas principales (rutas Vue Router)
    MainMenu.vue
    DeckSelectionView.vue
    MapView.vue
    EventModal.vue        # Montado sobre MapView como overlay
    CombatView.vue        # Contiene el canvas de PixiJS
    RewardScreen.vue
    GameOverView.vue
    VictoryView.vue

  /engine             # Lógica pura — sin imports de Vue ni PixiJS
    /entities
      Player.js           # Clase con stats, HP, débuffs
      Boss.js             # Clase con AttackPattern[], selección de patrón
      Card.js             # Definición + fábrica de cartas
      Debuff.js           # Modelo y aplicación de penalizaciones
      DeckArchetype.js    # Arquetipos iniciales (constantes)

    /combat
      CombatEngine.js     # Game loop principal (tick, update, colisiones)
      AttackPatternSelector.js  # Elegibilidad de patrones por HP threshold
      DamageCalculator.js       # Formula daño_final = (base + flat) × mult
      CollisionSystem.js        # AABB / hitbox detection

    /simulation
      EventResolver.js    # Resolución de Outcome por peso (RNG)
      MapGenerator.js     # Generación de lista de islas, gate logic
      SeaEventRoller.js   # Probabilidad progresiva eventos de mar
      ShopSystem.js       # Catálogo y validación de compras

  /stores             # Pinia stores
    playerStore.js
    gameStore.js
    deckStore.js

  /router
    index.js            # Definición de rutas

  main.js               # Punto de entrada: createApp + Pinia + Router

/tests
  /unit
    /engine
      DamageCalculator.test.js
      EventResolver.test.js
      AttackPatternSelector.test.js
      MapGenerator.test.js
      SeaEventRoller.test.js
      ShopSystem.test.js
    /stores
      playerStore.test.js
      deckStore.test.js

.github/workflows/ci.yml
Dockerfile
vite.config.js
vitest.config.js
eslint.config.js
```

---

## 3. Integración Vue.js 3 + PixiJS

### 3.1 Responsabilidades separadas

```
Vue 3                          PixiJS
─────────────────────────────  ──────────────────────────────
Pantallas, menús, HUD          Canvas de combate (60 FPS)
Modales, cartas, mapa          Sprites: jugador, jefe, FX
Estado reactivo (Pinia)        Hitboxes, colisiones, animación
Transiciones de ruta           Bucle requestAnimationFrame
```

Vue **nunca renderiza entidades de combate** (jugador, jefe, proyectiles). PixiJS **nunca construye componentes Vue**.

### 3.2 Montaje del canvas en `CombatView.vue`

```vue
<!-- src/views/CombatView.vue -->
<template>
  <div class="combat-wrapper">
    <!-- HUD Vue (reactivo, encima del canvas) -->
    <HealthBar :current="playerStore.hp" :max="playerStore.maxHp" />
    <BossHealthBar :current="gameStore.bossHp" :max="gameStore.bossMaxHp" />
    <DebuffIndicator v-if="playerStore.hasActiveDebuffs" />

    <!-- Contenedor del canvas PixiJS -->
    <div ref="pixiContainer" class="pixi-canvas-host" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { usePlayerStore }  from '@/stores/playerStore'
import { useGameStore }    from '@/stores/gameStore'
import { createCombatApp } from '@/engine/combat/CombatEngine'

const pixiContainer = ref(null)
const playerStore   = usePlayerStore()
const gameStore     = useGameStore()

let combatApp = null   // instancia PixiJS

onMounted(() => {
  // 1. Crear la instancia de PixiJS
  combatApp = createCombatApp({
    container: pixiContainer.value,
    boss: gameStore.currentBoss,          // datos del jefe actual
    onPlayerHit: (damage) => {
      playerStore.applyDamage(damage)     // acción Pinia
    },
    onBossDefeated: () => {
      gameStore.resolveCombatVictory()    // acción Pinia → navega a RewardScreen
    },
    onPlayerDefeated: () => {
      gameStore.resolveGameOver()         // acción Pinia → navega a GameOverView
    },
  })

  combatApp.start()
})

onUnmounted(() => {
  // 2. Destruir PixiJS limpiamente: libera WebGL, listeners y memoria
  if (combatApp) {
    combatApp.destroy()
    combatApp = null
  }
})
</script>
```

### 3.3 `createCombatApp` — fábrica del motor

```js
// src/engine/combat/CombatEngine.js
import * as PIXI from 'pixi.js'

export function createCombatApp({ container, boss, onPlayerHit, onBossDefeated, onPlayerDefeated }) {
  const app = new PIXI.Application()

  async function start() {
    await app.init({
      width: 960,
      height: 540,
      backgroundColor: 0x1a1a2e,
      antialias: true,
    })
    container.appendChild(app.canvas)

    // --- Cargar assets, crear entidades, iniciar loop ---
    loadAssets().then(() => {
      setupScene({ app, boss })
      app.ticker.add((ticker) => gameLoop(ticker.deltaTime))
    })
  }

  function gameLoop(delta) {
    updatePlayer(delta)
    updateBoss(delta)
    checkCollisions({ onPlayerHit, onBossDefeated, onPlayerDefeated })
  }

  function destroy() {
    app.ticker.stop()
    app.destroy(true, { children: true, texture: true })
  }

  return { start, destroy }
}
```

**Puntos clave:**
- `app.destroy(true, { children: true, texture: true })` libera el contexto WebGL y las texturas.
- El HUD Vue (HealthBar, etc.) es **independiente** del canvas PixiJS: flota encima con CSS `position: absolute`.
- Los callbacks (`onPlayerHit`, `onBossDefeated`) son el único canal de salida del motor hacia Vue.

---

## 4. Puente de Comunicación PixiJS ↔ Vue / Pinia

```
┌─────────────────────────┐         ┌───────────────────────────────┐
│     Vue / Pinia          │         │         PixiJS Engine          │
│                          │         │                                │
│  gameStore.currentBoss ──┼──────►  │  boss (datos leídos una vez)  │
│  playerStore.stats     ──┼──────►  │  player.speed, player.damage  │
│                          │         │                                │
│  playerStore.hp        ◄─┼────────  │  callbacks: onPlayerHit(dmg)  │
│  gameStore.bossHp      ◄─┼──(NO)──  │  PixiJS NO escribe en Pinia   │
│                          │  Pinia   │  directamente; usa callbacks   │
│  router.push(route)    ◄─┼────────  │  onBossDefeated()             │
└─────────────────────────┘         └───────────────────────────────┘
```

### Reglas del puente

| Dirección | Mecanismo | Ejemplo |
|---|---|---|
| Vue → PixiJS | Parámetros en `createCombatApp()` | `boss`, `player.stats` |
| PixiJS → Vue | Callbacks inyectados | `onPlayerHit(damage)` |
| Lectura de estado en loop | Import directo del store (fuera del contexto Vue) | `playerStore.stats.damage` |

> **Por qué callbacks y no reactivity directa**: PixiJS corre en un ticker fuera del ciclo de Vue. Escribir directamente en refs/computed desde el loop de 60fps provocaría re-renders innecesarios. Los callbacks delegan al store que decide cuándo disparar la reactividad.

### Lectura de Pinia desde PixiJS (ejemplo: stats del jugador)

```js
// src/engine/combat/CombatEngine.js
// PixiJS puede importar el store directamente, pero solo LEER
import { usePlayerStore } from '@/stores/playerStore'

// Se llama UNA vez al inicio del combate para capturar snapshot de stats
function buildPlayerEntity() {
  const store = usePlayerStore()  // Pinia funciona fuera de componentes Vue
  return {
    hp:     store.hp,
    speed:  store.stats.speed,
    damage: store.stats.damage,    // ya incluye flat_bonus de Pasivas
  }
}
```

> El snapshot se toma al iniciar el combate. Cambios mid-combat (debuffs de eventos de mar) se pasan como parámetros al constructor, no se leen en tiempo real desde el ticker.

### Actualización del HP del jefe en el HUD Vue

El HP del jefe vive en `gameStore.bossHp` (número reactivo). PixiJS lo actualiza a través del callback:

```js
// Dentro del CombatEngine, cuando el jugador golpea al jefe:
function dealDamageToCurrentBoss(amount) {
  currentBoss.hp -= amount
  onBossHpChanged(currentBoss.hp)  // callback inyectado desde CombatView
}
```

```vue
<!-- CombatView.vue: onBossHpChanged actualiza el store -->
combatApp = createCombatApp({
  onBossHpChanged: (newHp) => { gameStore.bossHp = newHp }
})
```

---

## 5. Stores de Pinia

### 5.1 `playerStore`

```js
// src/stores/playerStore.js
import { defineStore } from 'pinia'
import { computed }    from 'vue'
import { useDecStore } from './deckStore'

export const usePlayerStore = defineStore('player', {
  state: () => ({
    hp:           100,
    maxHp:        100,
    gold:         0,
    activeDebuffs: [],   // Debuff[]
    // Stats base — modificados por Pasivas en computed
    _baseDamage:  10,
    _baseSpeed:   200,
  }),

  getters: {
    // daño_final = (base_damage + flat_bonus) × multiplicador
    stats: (state) => {
      const deckStore  = useDecStore()
      const passives   = deckStore.passiveCards

      const flat_bonus     = passives.reduce((acc, c) => acc + (c.effect.flatDamage ?? 0), 0)
      const multiplicador  = passives.reduce((acc, c) => acc * (c.effect.damageMult ?? 1), 1)
      const flatHpBonus    = passives.reduce((acc, c) => acc + (c.effect.flatHp ?? 0), 0)

      // Débuffs activos (eventos de mar)
      const debuffDmgMult  = state.activeDebuffs
        .filter(d => d.type === 'damage')
        .reduce((acc, d) => acc * (1 - d.magnitude), 1)
      const debuffSpeedMult = state.activeDebuffs
        .filter(d => d.type === 'speed')
        .reduce((acc, d) => acc * (1 - d.magnitude), 1)

      return {
        damage:  ((state._baseDamage + flat_bonus) * multiplicador) * debuffDmgMult,
        speed:   state._baseSpeed * debuffSpeedMult,
        maxHp:   state.maxHp + flatHpBonus,
      }
    },

    hasActiveDebuffs: (state) => state.activeDebuffs.length > 0,
  },

  actions: {
    applyDamage(amount) {
      this.hp = Math.max(0, this.hp - amount)
    },
    heal(amount) {
      this.hp = Math.min(this.maxHp, this.hp + amount)
    },
    addGold(amount) {
      this.gold += amount
    },
    spendGold(amount) {
      if (this.gold < amount) throw new Error('Fondos insuficientes')
      this.gold -= amount
    },
    addDebuff(debuff) {
      this.activeDebuffs.push(debuff)
    },
    clearCombatDebuffs() {
      // Llama al final de cada combate; expira los que tienen expireAfterCombat=true
      this.activeDebuffs = this.activeDebuffs.filter(d => !d.expireAfterCombat)
    },
    reset() {
      this.hp           = 100
      this.maxHp        = 100
      this.gold         = 0
      this.activeDebuffs = []
    },
  },
})
```

### 5.2 `gameStore`

```js
// src/stores/gameStore.js
import { defineStore }     from 'pinia'
import { useRouter }       from 'vue-router'
import { usePlayerStore }  from './playerStore'
import { useDeckStore }    from './deckStore'

export const useGameStore = defineStore('game', {
  state: () => ({
    currentPhase:             'menu',      // 'menu'|'deck-selection'|'exploration'|'combat'|'reward'
    currentIsland:            null,        // Island | null
    currentBoss:              null,        // Boss  | null — datos para CombatEngine
    bossHp:                   0,           // actualizado en tiempo real por CombatEngine
    bossMaxHp:                0,
    regularIslandsCompleted:  0,
    bossIslandsDefeated:      [],          // Island[]
    pendingDebuffs:           [],          // Debuff[] por aplicar antes del próximo combate
    isCompleted:              false,
    isVictory:                false,
    pendingRewards:           null,        // { gold, cards } mostrado en RewardScreen
    chosenArchetype:          null,        // 'action'|'balanced'|'exploration'
  }),

  getters: {
    isBossGate:  (state) => state.regularIslandsCompleted > 0
                            && state.regularIslandsCompleted % 3 === 0
                            && state.bossIslandsDefeated.length < 1,
    isFinalGate: (state) => state.bossIslandsDefeated.length >= 1,
  },

  actions: {
    startNewRun(archetypeId) {
      const player = usePlayerStore()
      const deck   = useDeckStore()
      player.reset()
      deck.initWithArchetype(archetypeId)
      this.$reset()
      this.chosenArchetype   = archetypeId
      this.currentPhase      = 'exploration'
    },

    enterCombat(boss) {
      // Aplicar debuffs pendientes de eventos de mar ANTES del combate
      const player = usePlayerStore()
      this.pendingDebuffs.forEach(d => player.addDebuff(d))
      this.pendingDebuffs = []

      this.currentBoss   = boss
      this.bossHp        = boss.hp
      this.bossMaxHp     = boss.maxHp
      this.currentPhase  = 'combat'
    },

    resolveCombatVictory() {
      const player = usePlayerStore()
      player.clearCombatDebuffs()

      // Calcular recompensas (delegado al engine de simulación)
      this.pendingRewards = computeRewards(this.currentBoss)
      this.currentPhase   = 'reward'

      if (this.currentBoss.isMajor) {
        this.bossIslandsDefeated.push(this.currentIsland)
      } else {
        this.regularIslandsCompleted++
      }
    },

    resolveGameOver() {
      this.currentPhase = 'gameover'
    },
  },
})
```

### 5.3 `deckStore`

```js
// src/stores/deckStore.js
import { defineStore }      from 'pinia'
import { ARCHETYPES }       from '@/engine/entities/DeckArchetype'

export const useDeckStore = defineStore('deck', {
  state: () => ({
    cards: [],    // Card[] — mazo completo del jugador
  }),

  getters: {
    actionCards:  (state) => state.cards.filter(c => c.type === 'action'),
    passiveCards: (state) => state.cards.filter(c => c.type === 'passive'
                                                   || c.type === 'weapon'
                                                   || c.type === 'armor'),
    utilityCards: (state) => state.cards.filter(c => c.type === 'utility'),
    hasCard: (state) => (cardId) => state.cards.some(c => c.id === cardId),
  },

  actions: {
    initWithArchetype(archetypeId) {
      const archetype = ARCHETYPES[archetypeId]
      // Deep-clone para no mutar las constantes
      this.cards = archetype.startingCards.map(c => ({ ...c }))
    },
    addCard(card) {
      this.cards.push({ ...card })
    },
    removeCard(cardId) {
      // Consume una sola instancia (utilidades)
      const idx = this.cards.findIndex(c => c.id === cardId)
      if (idx !== -1) this.cards.splice(idx, 1)
    },
    reset() {
      this.cards = []
    },
  },
})
```

---

## 6. Flujo de Pantallas / Router

### 6.1 Diagrama de pantallas

```
MainMenu
   │
   ▼  (Nueva Partida)
DeckSelectionView         ← jugador elige arquetipo (Acción / Equilibrado / Exploración)
   │
   ▼  (Confirmar arquetipo)
MapView                   ← muestra 3 islas disponibles
   │
   ├──[isla regular / tienda]──► EventModal (overlay sobre MapView)
   │                                  │
   │                            [decisión resuelta]
   │                                  │
   │                ┌─────────────────┘
   │                │ si outcome = boss
   │                ▼
   │           CombatView             ← monta PixiJS
   │                │
   │           [victoria]──► RewardScreen ──► MapView
   │           [derrota]───► GameOverView ──► MainMenu
   │
   ├──[isla de jefe]──────────► CombatView (sin EventModal)
   │
   └──[isla final]────────────► CombatView (jefe final)
                                      │
                               [victoria]──► VictoryView ──► MainMenu
```

### 6.2 Definición de rutas

```js
// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/',            name: 'main-menu',      component: () => import('@/views/MainMenu.vue') },
  { path: '/deck-select', name: 'deck-selection', component: () => import('@/views/DeckSelectionView.vue') },
  { path: '/map',         name: 'map',            component: () => import('@/views/MapView.vue') },
  { path: '/combat',      name: 'combat',         component: () => import('@/views/CombatView.vue') },
  { path: '/reward',      name: 'reward',         component: () => import('@/views/RewardScreen.vue') },
  { path: '/gameover',    name: 'gameover',       component: () => import('@/views/GameOverView.vue') },
  { path: '/victory',     name: 'victory',        component: () => import('@/views/VictoryView.vue') },
]

export default createRouter({ history: createWebHashHistory(), routes })
```

`EventModal` es un **componente overlay** montado dentro de `MapView.vue` con `v-if="gameStore.currentEvent !== null"`. No tiene ruta propia porque no es una pantalla de navegación; comparte el contexto del mapa.

### 6.3 Guards de navegación

```js
// Guard global: bloquea /combat y /reward sin partida activa
router.beforeEach((to) => {
  const game = useGameStore()
  if (['combat','reward'].includes(to.name) && game.currentPhase === 'menu') {
    return { name: 'main-menu' }
  }
})
```

---

## 7. Arquitectura del Engine (JS Puro)

El directorio `/engine` **no importa** nada de Vue, Pinia ni PixiJS. Es lógica pura testeable con Vitest sin DOM.

### 7.1 `/engine/entities`

```
Player.js          — Clase con hp, stats, cálculo de daño
Boss.js            — Clase con hp, attackPatterns, selección de patrón activo
Card.js            — Definición de card + función fábrica createCard(id)
Debuff.js          — Modelo Debuff { type, magnitude, expireAfterCombat }
DeckArchetype.js   — ARCHETYPES constante con los 3 arquetipos iniciales
```

**`Player.js`** — solo datos y cálculos:

```js
// src/engine/entities/Player.js
export class Player {
  constructor({ hp = 100, gold = 0, stats = {} } = {}) {
    this.hp       = hp
    this.maxHp    = hp
    this.gold     = gold
    this.debuffs  = []
    this._base    = { damage: 10, speed: 200, ...stats }
  }

  computeStats(passiveCards) {
    const flatDmg  = passiveCards.reduce((s, c) => s + (c.effect.flatDamage ?? 0), 0)
    const multDmg  = passiveCards.reduce((s, c) => s * (c.effect.damageMult ?? 1), 1)
    const dmgDebuf = this.debuffs.filter(d => d.type === 'damage')
                       .reduce((s, d) => s * (1 - d.magnitude), 1)
    const spdDebuf = this.debuffs.filter(d => d.type === 'speed')
                       .reduce((s, d) => s * (1 - d.magnitude), 1)
    return {
      damage: ((this._base.damage + flatDmg) * multDmg) * dmgDebuf,
      speed:  this._base.speed * spdDebuf,
    }
  }
}
```

### 7.2 `/engine/combat`

```
CombatEngine.js            — Fábrica que devuelve { start, destroy }; game loop PixiJS
AttackPatternSelector.js   — Filtra patrones elegibles por HP del jefe
DamageCalculator.js        — Función pura: finalDamage(base, passives, debuffs)
CollisionSystem.js         — AABB check entre hitboxes; retorna lista de colisiones
```

**`DamageCalculator.js`** — función pura testeable:

```js
// src/engine/combat/DamageCalculator.js

/**
 * Calcula daño_final = (damage_base + flat_bonus) × multiplicador
 * @param {number} base - damage base del jugador (10)
 * @param {Card[]} passives - cartas Pasivas equipadas
 * @param {Debuff[]} debuffs - débuffs activos de tipo 'damage'
 * @returns {number} daño final redondeado
 */
export function calculateDamage(base, passives, debuffs) {
  const flatBonus      = passives.reduce((s, c) => s + (c.effect.flatDamage ?? 0), 0)
  const multiplicador  = passives.reduce((s, c) => s * (c.effect.damageMult ?? 1), 1)
  const debuffMult     = debuffs
    .filter(d => d.type === 'damage')
    .reduce((s, d) => s * (1 - d.magnitude), 1)

  return Math.round((base + flatBonus) * multiplicador * debuffMult)
}
```

### 7.3 `/engine/simulation`

```
EventResolver.js    — Weighted RNG sobre Outcome[]; resuelve decisiones
MapGenerator.js     — Genera lista de islas desde banco; aplica gate logic
SeaEventRoller.js   — Calcula probabilidad progresiva y decide si dispara evento
ShopSystem.js       — Valida compras, genera catálogo, descuenta oro
```

**`EventResolver.js`** — núcleo del sistema de decisiones:

```js
// src/engine/simulation/EventResolver.js

/**
 * Selecciona un Outcome dado un array de outcomes con pesos.
 * Los pesos deben sumar 100.
 * @param {Outcome[]} outcomes
 * @param {() => number} rng - función que retorna [0,1); default Math.random
 * @returns {Outcome}
 */
export function resolveOutcome(outcomes, rng = Math.random) {
  const roll  = rng() * 100
  let   accum = 0
  for (const outcome of outcomes) {
    accum += outcome.weight
    if (roll < accum) return outcome
  }
  return outcomes[outcomes.length - 1]  // fallback por flotantes
}
```

---

## 8. Diseño del Boss con AttackPattern Extensible

### 8.1 Interfaz de datos (JSDoc)

```js
/**
 * @typedef {Object} Zone
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} AttackPattern
 * @property {string}   id
 * @property {number}   telegraphDurationMs   - Mínimo 1000 ms (FR-015)
 * @property {Zone[]}   zones
 * @property {number}   damage
 * @property {number}   [hpThreshold]         - 0–100. RESERVADO PARA USO FUTURO.
 *   Si está ausente o undefined, el patrón está SIEMPRE activo.
 *   Cuando se implemente: el patrón es elegible cuando bossHpPercent <= hpThreshold.
 */

/**
 * @typedef {Object} Boss
 * @property {string}          id
 * @property {string}          name
 * @property {number}          hp
 * @property {number}          maxHp
 * @property {AttackPattern[]} attackPatterns
 * @property {Card[]}          lootPool
 * @property {Card}            [uniqueCard]   - Solo isMajor=true
 * @property {boolean}         isMajor
 */
```

### 8.2 Selección de patrón (hoy y en el futuro)

```js
// src/engine/combat/AttackPatternSelector.js

/**
 * Retorna los patrones de ataque elegibles dado el HP actual del jefe.
 *
 * Hoy (v1): todos los patrones sin hpThreshold están activos.
 * Futuro (v2+): patrones con hpThreshold se activan cuando bossHpPercent <= hpThreshold.
 *
 * @param {AttackPattern[]} patterns
 * @param {number} bossHp       - HP actual
 * @param {number} bossMaxHp    - HP máximo
 * @returns {AttackPattern[]}   - Subconjunto elegible
 */
export function getEligiblePatterns(patterns, bossHp, bossMaxHp) {
  const hpPercent = (bossHp / bossMaxHp) * 100

  return patterns.filter(p =>
    p.hpThreshold === undefined
    || p.hpThreshold === null
    || hpPercent <= p.hpThreshold
  )
}

/**
 * Elige un patrón aleatorio del conjunto elegible.
 * @param {AttackPattern[]} eligible
 * @param {() => number} rng
 * @returns {AttackPattern}
 */
export function pickPattern(eligible, rng = Math.random) {
  if (eligible.length === 0) throw new Error('No hay patrones elegibles')
  return eligible[Math.floor(rng() * eligible.length)]
}
```

### 8.3 Datos de ejemplo de un jefe (v1 — sin fases)

```js
// src/assets/data/bosses.json (fragmento)
{
  "id": "almirante_rojo",
  "name": "El Almirante Rojo",
  "hp": 400,
  "maxHp": 400,
  "isMajor": true,
  "attackPatterns": [
    {
      "id": "canonazo_frontal",
      "telegraphDurationMs": 1500,
      "damage": 25,
      "zones": [{ "x": 0, "y": 300, "width": 960, "height": 80 }]
      // hpThreshold ausente → siempre activo
    },
    {
      "id": "salva_lateral",
      "telegraphDurationMs": 2000,
      "damage": 15,
      "zones": [
        { "x": 0,   "y": 0, "width": 200, "height": 540 },
        { "x": 760, "y": 0, "width": 200, "height": 540 }
      ]
      // hpThreshold: 50  ← comentado; RESERVADO para activar en fase 2
    }
  ],
  "lootPool": ["carta_canon", "carta_abordaje", "carta_rum"],
  "uniqueCard": "fuerza_del_almirante"
}
```

### 8.4 Cómo agregar una fase de jefe en el futuro (sin breaking change)

Para activar patrones de fase en una iteración futura:

1. Descomentar el campo `hpThreshold` en el JSON del jefe.
2. `AttackPatternSelector.getEligiblePatterns()` ya lo maneja sin cambios.
3. No se modifica ninguna interfaz existente; el campo es opcional y backward-compatible.

---

## 9. Sistema de Economía

### 9.1 Reglas de negocio

| Fuente | Rango de oro |
|---|---|
| Inicio de partida | **0** (FR-048) |
| Primer combate regular | 8–20 monedas |
| Eventos regulares (sin combate) | 5–15 monedas |
| Combates menores (jefes regulares) | 8–20 monedas |
| Jefes principales (islas de jefe) | 30–60 monedas |
| Precio mínimo en tienda | **15 monedas** (FR-052) |

### 9.2 Catálogo de tienda

| Categoría | Rango de precio |
|---|---|
| Carta común | 15–25 monedas |
| Carta rara | 40–70 monedas |
| Arma | 30–80 monedas |
| Armadura | 30–80 monedas |

### 9.3 `ShopSystem.js`

```js
// src/engine/simulation/ShopSystem.js

/**
 * Valida y ejecuta una compra.
 * @param {number} playerGold - Oro actual del jugador
 * @param {Card}   item       - Ítem a comprar (tiene .cost)
 * @returns {{ success: boolean, reason?: string }}
 */
export function attemptPurchase(playerGold, item) {
  if (item.cost < 15) {
    throw new Error(`Item ${item.id} tiene precio ${item.cost} < mínimo de 15`)
  }
  if (playerGold < item.cost) {
    return { success: false, reason: 'gold_insufficient' }
  }
  return { success: true }
}

/**
 * Genera un catálogo de tienda aleatorio.
 * Garantiza que el ítem más barato cuesta >= 15 monedas.
 * @param {Card[]} cardPool
 * @param {number} catalogSize - default 6 ítems
 * @param {() => number} rng
 * @returns {Card[]}
 */
export function generateShopCatalog(cardPool, catalogSize = 6, rng = Math.random) {
  const shuffled = [...cardPool].sort(() => rng() - 0.5)
  const catalog  = shuffled.slice(0, catalogSize)
  // Invariante de seguridad: ningún ítem < 15 monedas
  if (catalog.some(c => c.cost < 15)) {
    throw new Error('Invariante violada: ítem de tienda con precio < 15')
  }
  return catalog
}
```

### 9.4 Flujo de economía en una partida tipo

```
Inicio          → 0 monedas
Isla regular 1  → +8 a +20  → 8–20 monedas  (no alcanza para tienda aún)
Isla regular 2  → +5 a +15  → 13–35 monedas (primera compra posible con suerte)
Isla de jefe    → +30 a +60 → progresión acelerada
Antes de final  → 60–150 monedas acumuladas (compras estratégicas posibles)
```

---

## 10. Selección de Mazo Inicial (Arquetipos)

### 10.1 Constantes de arquetipos

```js
// src/engine/entities/DeckArchetype.js

export const ARCHETYPES = {
  action: {
    id:          'action',
    name:        'Acción',
    description: 'Orientado al combate puro. Tres habilidades activas desde el inicio.',
    startingCards: [
      { id: 'dash_brutal',    type: 'action',  cooldown: 4 },
      { id: 'golpe_pesado',   type: 'action',  cooldown: 6 },
      { id: 'ola_de_impacto', type: 'action',  cooldown: 8 },
    ],
  },
  balanced: {
    id:          'balanced',
    name:        'Equilibrado',
    description: 'Versatilidad desde el inicio: ataque, defensa y utilidad.',
    startingCards: [
      { id: 'slash_rapido',   type: 'action',  cooldown: 3 },
      { id: 'escudo_de_mar',  type: 'passive', effect: { flatHp: 20 } },
      { id: 'brujula_vieja',  type: 'utility' },
    ],
  },
  exploration: {
    id:          'exploration',
    name:        'Exploración',
    description: 'Optimizado para eventos de isla. Dos cartas de utilidad abren caminos bloqueados.',
    startingCards: [
      { id: 'disparo_preciso', type: 'action',  cooldown: 5 },
      { id: 'amuleto_marino',  type: 'passive', effect: { damageMult: 1.2 } },
      { id: 'llave_oxidada',   type: 'utility' },
      { id: 'mapa_antiguo',    type: 'utility' },
    ],
  },
}
```

### 10.2 `DeckSelectionView.vue` — pantalla de selección

```vue
<template>
  <section class="deck-selection">
    <h1>Elige tu Arquetipo</h1>
    <div class="archetypes-grid">
      <ArchetypeCard
        v-for="arch in archetypes"
        :key="arch.id"
        :archetype="arch"
        :selected="selectedId === arch.id"
        @select="selectedId = arch.id"
      />
    </div>
    <Button :disabled="!selectedId" @click="confirm">Comenzar Aventura</Button>
  </section>
</template>

<script setup>
import { ref }           from 'vue'
import { useRouter }     from 'vue-router'
import { useGameStore }  from '@/stores/gameStore'
import { ARCHETYPES }    from '@/engine/entities/DeckArchetype'

const router      = useRouter()
const gameStore   = useGameStore()
const archetypes  = Object.values(ARCHETYPES)
const selectedId  = ref(null)

function confirm() {
  gameStore.startNewRun(selectedId.value)
  router.push({ name: 'map' })
}
</script>
```

---

## 11. Probabilidad Progresiva de Eventos de Mar

### 11.1 Fórmula

La probabilidad de que ocurra un evento de mar al navegar hacia la isla `n` es:

$$P(n) = P_{min} + (P_{max} - P_{min}) \times \frac{n}{N_{total}}$$

Con los valores definidos en FR-034:

| Parámetro | Valor |
|---|---|
| $P_{min}$ | 0.10 (10% en las primeras islas) |
| $P_{max}$ | 0.45 (45% al llegar al final) |
| $N_{total}$ | 8 (estimación: 5 regulares + 3 jefes) |
| $n$ | Número de islas completadas (0–8) |

**Resultado**:

| Islas completadas ($n$) | $P(n)$ |
|---|---|
| 0 | 10.0 % |
| 2 | 18.75 % |
| 4 | 27.5 % |
| 6 | 36.25 % |
| 8 | 45.0 % |

La progresión es **continua y lineal**, no escalonada.

### 11.2 Implementación

```js
// src/engine/simulation/SeaEventRoller.js

const P_MIN      = 0.10
const P_MAX      = 0.45
const N_TOTAL    = 8    // total estimado de islas en una partida completa

/**
 * Calcula la probabilidad de evento de mar según el progreso de la partida.
 * @param {number} islandsCompleted - islas terminadas hasta ahora
 * @returns {number} probabilidad entre 0 y 1
 */
export function seaEventProbability(islandsCompleted) {
  const t = Math.min(islandsCompleted / N_TOTAL, 1)
  return P_MIN + (P_MAX - P_MIN) * t
}

/**
 * Determina si se dispara un evento de mar.
 * @param {number} islandsCompleted
 * @param {() => number} rng - default Math.random
 * @returns {boolean}
 */
export function shouldTriggerSeaEvent(islandsCompleted, rng = Math.random) {
  return rng() < seaEventProbability(islandsCompleted)
}
```

### 11.3 Invocación desde `MapView.vue`

```js
// Al confirmar navegación hacia una isla
async function navigateToIsland(island) {
  const roll = shouldTriggerSeaEvent(gameStore.regularIslandsCompleted)
  if (roll) {
    const seaEvent = pickRandomSeaEvent()          // desde events.json
    gameStore.setCurrentEvent(seaEvent)            // abre EventModal
    await waitForEventResolution()                 // Promise que resuelve cuando el modal cierra
  }
  gameStore.setCurrentIsland(island)
  if (island.type === 'boss' || island.type === 'final') {
    router.push({ name: 'combat' })
  } else {
    gameStore.setCurrentEvent(island.events[0])   // abre EventModal del evento de isla
  }
}
```

---

## 12. Estrategia de Pruebas

### 12.1 Tests unitarios del engine (Vitest)

| Módulo | Casos a cubrir |
|---|---|
| `DamageCalculator` | Sin pasivas, con flat bonus, con mult, con débuff, combinados |
| `AttackPatternSelector` | Sin threshold (todos activos), con threshold (fase futura), edge HP=0 |
| `EventResolver` | Distribución de pesos, peso=100 único, resultados anidados |
| `MapGenerator` | Generación inicial, gate después de 5 regulares, gate final, sin repetición de jefes |
| `SeaEventRoller` | P(0)=0.10, P(8)=0.45, linealidad, never triggers at n=0 con rng=1 |
| `ShopSystem` | Compra exitosa, oro insuficiente, precio < 15 lanza error |

### 12.2 Tests de stores (Vitest + @pinia/testing)

| Store | Casos |
|---|---|
| `playerStore` | reset, applyDamage, heal límite, addGold, spendGold insuficiente, clearDebuffs |
| `deckStore` | initWithArchetype 3 arquetipos, addCard, removeCard (utilidad consumida) |

### 12.3 Pipeline CI

```yaml
# .github/workflows/ci.yml (esquema)
on: [push, pull_request]
jobs:
  quality:
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test --reporter=verbose --coverage
      - run: pnpm build
```

Objetivo: **< 5 minutos** por ejecución (SC-006).

---

*Plan generado: 2026-05-04 | Rama: `001-fathoms-end-core`*
