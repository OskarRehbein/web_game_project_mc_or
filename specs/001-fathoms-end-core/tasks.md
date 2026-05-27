# Tasks: Fathom's End — Core Game

**Feature Branch**: `001-fathoms-end-core`  
**Input**: `specs/001-fathoms-end-core/plan.md` + `specs/001-fathoms-end-core/spec.md`  
**Stack**: Vue 3 (Composition API) · PixiJS v8 · JavaScript ES2022 · Pinia · Vue Router 4 · Vitest · ESLint · Docker · GitHub Actions · pnpm

## Format: `[ID] [P?] [Story?] Description — file/path`

- **[P]**: Paralelizable (archivos distintos, sin dependencias incompletas)
- **[US#]**: Historia de usuario a la que pertenece
- Los IDs son secuenciales en orden de ejecución

---

## Phase 1: Setup (Infraestructura Compartida)

**Objetivo**: Inicializar el proyecto completo con todas las herramientas configuradas y listas para desarrollar.

- [X] T001 Crear estructura de carpetas del proyecto según plan.md sección 2 (`src/engine`, `src/components`, `src/views`, `src/stores`, `src/router`, `src/assets/data`, `src/assets/sprites`, `src/assets/ui`, `tests/unit/engine`, `tests/unit/stores`)
- [X] T002 Actualizar `package.json` con todas las dependencias: Vue 3, PixiJS v8, Pinia, Vue Router 4 como deps; Vitest, `@vitest/coverage-v8`, `@vue/test-utils`, `@pinia/testing`, `jsdom`, ESLint, `eslint-plugin-vue` como devDeps; agregar scripts `dev`, `build`, `preview`, `test`, `test:coverage`, `lint` en `package.json`
- [X] T003 [P] Configurar Vite con alias `@` apuntando a `src/` y plugin `@vitejs/plugin-vue` en `vite.config.js`
- [X] T004 [P] Configurar Vitest con entorno `jsdom`, coverage provider `v8` y soporte de alias `@` en `vitest.config.js`
- [X] T005 [P] Configurar ESLint con `eslint-plugin-vue` y reglas `vue3-recommended` en `eslint.config.js`
- [X] T006 [P] Crear `Dockerfile` con build multi-etapa (Node 22 para build, Nginx Alpine para serve) y `.dockerignore` en raíz del repositorio
- [X] T007 [P] Crear workflow CI/CD en `.github/workflows/ci.yml` con jobs: `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm test --coverage` → `pnpm build` (objetivo: < 5 min por push)
- [X] T008 Crear punto de entrada de la aplicación `src/main.js` con `createApp(App)` + Pinia (`createPinia()`) + Vue Router montados sobre `#app`; crear `src/App.vue` con `<RouterView />`

**Checkpoint**: `pnpm dev` levanta el servidor, `pnpm test` corre 0 tests sin errores, `pnpm lint` pasa en verde.

---

## Phase 2: Foundational (Prerrequisitos Bloqueantes)

**Objetivo**: Entidades puras, stores de Pinia y router completos. **Ninguna historia de usuario puede comenzar sin completar esta fase.**

⚠️ **CRÍTICO**: Todo el código del motor (`/engine`) debe ser JavaScript puro sin imports de Vue ni PixiJS.

- [X] T009 [P] Implementar `Card` (clase/objeto con `id`, `name`, `type`, `rarity`, `effect`, `cooldown?`, `cost`) y función fábrica `createCard(id, data)` en `src/engine/entities/Card.js`
- [X] T010 [P] Implementar modelo `Debuff` (`{ type, magnitude, expireAfterCombat }`) con función `createDebuff(type, magnitude)` en `src/engine/entities/Debuff.js`
- [X] T011 Implementar constante `ARCHETYPES` con los 3 arquetipos iniciales (`action`, `balanced`, `exploration`) y sus `startingCards[]` en `src/engine/entities/DeckArchetype.js` (depende de T009)
- [X] T012 Implementar clase `Player` con constructor, `computeStats(passiveCards)` y fórmula `daño_final = (base + flat) × mult × debuffMult` en `src/engine/entities/Player.js` (depende de T010)
- [X] T013 Implementar clase `Boss` con `id`, `name`, `hp`, `maxHp`, `attackPatterns[]`, `lootPool[]`, `uniqueCard?`, `isMajor` en `src/engine/entities/Boss.js` (depende de T009)
- [X] T014 Implementar `playerStore` con state (`hp`, `maxHp`, `gold`, `activeDebuffs`, `_baseDamage`, `_baseSpeed`), getter `stats` (daño con bonos de Pasivas y débuffs) y actions (`applyDamage`, `heal`, `addGold`, `spendGold`, `addDebuff`, `clearCombatDebuffs`, `reset`) en `src/stores/playerStore.js`
- [X] T015 Implementar `deckStore` con state (`cards[]`), getters (`actionCards`, `passiveCards`, `utilityCards`, `hasCard`) y actions (`initWithArchetype`, `addCard`, `removeCard`, `reset`) en `src/stores/deckStore.js` (depende de T011)
- [X] T016 Implementar `gameStore` con state (`currentPhase`, `currentIsland`, `currentBoss`, `bossHp`, `bossMaxHp`, `regularIslandsCompleted`, `bossIslandsDefeated[]`, `pendingDebuffs[]`, `pendingRewards`, `chosenArchetype`), getters (`isBossGate`, `isFinalGate`) y actions (`startNewRun`, `enterCombat`, `resolveCombatVictory`, `resolveGameOver`) en `src/stores/gameStore.js` (depende de T014, T015)
- [X] T017 Configurar Vue Router con las 7 rutas (`/`, `/deck-select`, `/map`, `/combat`, `/reward`, `/gameover`, `/victory`), lazy-loading para todas las vistas y guard global que bloquea `/combat` y `/reward` cuando `currentPhase === 'menu'` en `src/router/index.js`
- [X] T018 [P] Crear componentes Vue compartidos reutilizables: `Button.vue` (variantes primary/secondary/disabled), `Modal.vue` (overlay con slot de contenido) y `ProbabilityBadge.vue` (muestra porcentaje de un outcome) en `src/components/shared/`
- [X] T019 [P] Crear `MainMenu.vue` (pantalla de título con botón "Nueva Partida" que navega a `/deck-select`) en `src/views/MainMenu.vue`

**Checkpoint**: Todos los stores son importables, el router navega entre rutas vacías sin errores, `pnpm test` pasa (aún sin tests de lógica).

---

## Phase 3: User Story 1 — Combate contra un Jefe (Priority: P1) 🎯 MVP

**Objetivo**: El jugador puede entrar a una pantalla de combate, moverse en tiempo real, usar cartas de Acción con cooldown, ver patrones de ataque telegrafíados y completar el combate con victoria o derrota.

**Independent Test**: Navegar directamente a `/combat` con un jefe cargado en `gameStore.currentBoss` desde datos ficticios en `bosses.json`. El combate debe ser completamente funcional sin necesitar el mapa ni la exploración.

### Tests — User Story 1

> ⚠️ Escribir primero, verificar que **FALLAN** antes de implementar

- [X] T020 [P] [US1] Escribir tests unitarios para `DamageCalculator` (sin pasivas → base 10, con `flatDamage` → suma, con `damageMult` → multiplica, con débuff → reduce, combinado) en `tests/unit/engine/DamageCalculator.test.js`
- [X] T021 [P] [US1] Escribir tests unitarios para `AttackPatternSelector` (sin `hpThreshold` → todos activos, patrón único, `pickPattern` sin elegibles → lanza error) en `tests/unit/engine/AttackPatternSelector.test.js`
- [X] T022 [P] [US1] Escribir tests unitarios para `playerStore` (`reset` limpia todo, `applyDamage` no baja de 0, `heal` no supera `maxHp`, `spendGold` insuficiente lanza error, `clearCombatDebuffs` expira solo los de combate) en `tests/unit/stores/playerStore.test.js`

### Implementación — User Story 1

- [X] T023 [P] [US1] Implementar `calculateDamage(base, passives, debuffs)` con fórmula `(base + flatBonus) × mult × debuffMult` y retorno redondeado en `src/engine/combat/DamageCalculator.js`
- [X] T024 [P] [US1] Implementar `getEligiblePatterns(patterns, bossHp, bossMaxHp)` (filtra por `hpThreshold` si existe) y `pickPattern(eligible, rng)` en `src/engine/combat/AttackPatternSelector.js`
- [X] T025 [P] [US1] Implementar `CollisionSystem` con detección AABB (`checkCollision(rectA, rectB)` retorna boolean) y `getCollisions(entities, zones)` en `src/engine/combat/CollisionSystem.js`
- [X] T026 [US1] Implementar `createCombatApp({ container, boss, onPlayerHit, onBossDefeated, onPlayerDefeated, onBossHpChanged })` con: inicialización de `PIXI.Application` (960×540), carga de assets, setup de escena (plataformas, sprites), game loop (`ticker.add`), sistema de telegraph (zona de peligro pre-ataque ≥1000 ms), y `destroy()` limpio en `src/engine/combat/CombatEngine.js` (depende de T023, T024, T025)
- [X] T027 [P] [US1] Crear datos de jefes iniciales con al menos 1 jefe menor (`isMajor: false`) y 1 jefe principal (`isMajor: true`, con `uniqueCard`), cada uno con ≥2 `attackPatterns` de `telegraphDurationMs ≥ 1000` en `src/assets/data/bosses.json`
- [X] T028 [P] [US1] Crear componentes HUD: `HealthBar.vue` (barra de vida jugador con porcentaje reactivo), `BossHealthBar.vue` (barra de vida del jefe visible en todo momento), `CooldownIndicator.vue` (indicador visual de cooldown restante por carta de Acción) en `src/components/hud/`
- [X] T029 [US1] Implementar `CombatView.vue`: montar canvas PixiJS en `<div ref="pixiContainer">` en `onMounted`, destruir en `onUnmounted`, overlay HUD Vue con `position: absolute` encima del canvas, snapshot de stats del jugador al iniciar combate en `src/views/CombatView.vue` (depende de T026, T028)
- [X] T030 [US1] Implementar `RewardScreen.vue` (muestra oro ganado y carta(s) obtenida, botón "Continuar" que llama `router.push({ name: 'map' })`) en `src/views/RewardScreen.vue`
- [X] T031 [US1] Implementar `GameOverView.vue` (pantalla de Game Over con botón "Reintentar" que llama `gameStore.startNewRun` y navega a `/deck-select`) en `src/views/GameOverView.vue`

**Checkpoint**: Navegando a `/combat` con un jefe ficticio se puede jugar una partida completa de combate con movimiento, cartas, telegraph, victoria y derrota. Los 3 tests pasan en verde.

---

## Phase 4: User Story 2 — Navegación del Mapa de Islas (Priority: P2)

**Objetivo**: El jugador ve 3 islas disponibles, elige una, lee el evento narrativo y toma una decisión informada con probabilidades visibles. Las cartas de Utilidad desbloquean opciones bloqueadas.

**Independent Test**: Navegar directamente a `/map` con un banco de islas pre-cargado en `islands.json`. Los eventos narrativos deben completarse con resolución de decisiones sin necesitar pasar por combate.

### Tests — User Story 2

- [X] T032 [P] [US2] Escribir tests unitarios para `MapGenerator` (genera exactamente 3 opciones, no repite isla anterior, samplea con reemplazo cuando el banco se agota) en `tests/unit/engine/MapGenerator.test.js`
- [X] T033 [P] [US2] Escribir tests unitarios para `EventResolver` (distribución de pesos suma 100, roll=0 → primer outcome, roll=99.9 → último outcome, fallback por flotantes) en `tests/unit/engine/EventResolver.test.js`

### Implementación — User Story 2

- [X] T034 [P] [US2] Implementar `resolveOutcome(outcomes, rng)` con weighted RNG sobre `outcome.weight` (pesos suman 100) y fallback al último elemento en `src/engine/simulation/EventResolver.js`
- [X] T035 [P] [US2] Implementar `MapGenerator` con: `generateIslandOptions(bank, count, previousIslandId)` (3 opciones aleatorias sin repetir la anterior, con reemplazo si el banco se agota), `applyIslandResult(island)` (marca `isCompleted`) en `src/engine/simulation/MapGenerator.js`
- [X] T036 [P] [US2] Crear banco de islas JSON con exactamente **6 islas regulares** (incluyendo 1–2 de tipo tienda), **3 islas de jefe** y 1 isla final `Fathom's End`; cada isla con `id`, `name`, `type`, `events[]` referenciados por ID en `src/assets/data/islands.json`
- [X] T037 [P] [US2] Crear eventos narrativos JSON con ≥10 eventos para islas regulares; cada evento con `id`, `title`, `description`, `decisions[]`; cada decisión con `text`, `requirements[]` (algunas requieren carta de Utilidad), `outcomes[]` con `weight`, `type`, `goldMin/Max`; incluir al menos 1 evento con resultado de tipo `boss` en `src/assets/data/events.json`
- [X] T038 [P] [US2] Crear componentes de evento: `DecisionCard.vue` (tarjeta interactiva con texto, iconografía, probabilidades y estado bloqueado si falta carta de Utilidad), `EventModal.vue` (overlay sobre MapView, muestra título+descripción+decisiones), `OutcomeDisplay.vue` (resultado resuelto con tipo e iconografía) en `src/components/events/` *(implementado como `EventWindow.vue` en `src/components/`, funcionalidad equivalente)*
- [X] T039 [P] [US2] Crear componentes de mapa: `IslandNode.vue` (nodo de isla con nombre, tipo, estado seleccionable), `MapCanvas.vue` (grid/layout de 3 opciones de isla con efectos de hover y selección) en `src/components/map/` *(implementado via canvas en `MapView.vue`)*
- [X] T040 [US2] Implementar `MapView.vue` con: carga de 3 opciones de isla desde `MapGenerator`, handler `navigateToIsland(island)` que abre `EventModal` para islas regulares y redirige a `/combat` para islas de jefe/final; overlay de `EventModal` con `v-if="gameStore.currentEvent !== null"` en `src/views/MapView.vue` (depende de T034, T035, T036, T037, T038, T039)

**Checkpoint**: Navegando a `/map` se pueden seleccionar islas, leer eventos, tomar decisiones con probabilidades visibles y consumir cartas de Utilidad en opciones bloqueadas. Los 2 tests pasan en verde.

---

## Phase 5: User Story 3 — Construcción del Mazo de Cartas (Priority: P3)

**Objetivo**: El jugador elige un arquetipo de mazo al iniciar, acumula cartas por combates y eventos, compra en la tienda con oro y las cartas Pasivas modifican las stats activamente.

**Independent Test**: Simular una recompensa de combate y verificar que las cartas se agregan correctamente al `deckStore`; navegar a `/deck-select` y confirmar que los 3 arquetipos se muestran con su composición completa.

### Tests — User Story 3

- [X] T041 [P] [US3] Escribir tests unitarios para `ShopSystem` (compra exitosa resta oro, oro insuficiente → `success: false`, `item.cost < 15` lanza error, catálogo generado no contiene ítems < 15 monedas; SC-009) en `tests/unit/engine/ShopSystem.test.js`
- [X] T042 [P] [US3] Escribir tests unitarios para `deckStore` (`initWithArchetype` produce las cartas correctas para los 3 arquetipos, `addCard` aumenta `cards.length`, `removeCard` elimina solo una instancia de utilidad) en `tests/unit/stores/deckStore.test.js` *(adelantado en Semana 2 con TDD del store)*

### Implementación — User Story 3

- [X] T043 [P] [US3] Implementar `ShopSystem` con `attemptPurchase(playerGold, item)` (valida `item.cost >= 15` e invariante de fondos) y `generateShopCatalog(cardPool, catalogSize, rng)` (garantiza precio ≥15 para todos los ítems) en `src/engine/simulation/ShopSystem.js`
- [X] T044 [P] [US3] Crear pool completo de cartas JSON con exactamente **9 cartas únicas** (3 `action`, 3 `passive`, 3 `utility`); rangos de `cost` correctos (común 15–25, rara 40–70); efectos `effect: { flatDamage?, damageMult?, flatHp?, healAmount? }` para pasivas/activas de curación en `src/assets/data/cards.json`
- [X] T045 [P] [US3] Crear componentes de cartas: `CardThumbnail.vue` (miniatura con nombre, tipo, iconografía de rareza), `DeckViewer.vue` (vista del mazo completo agrupado por tipo, usable fuera del combate), `CardShopItem.vue` (ítem de tienda con costo en oro y botón de compra reactivo al oro disponible) en `src/components/cards/`
- [X] T046 [US3] Implementar `DeckSelectionView.vue` con los 3 arquetipos renderizados como `ArchetypeCard` components, selección reactiva, y botón "Comenzar Aventura" que llama `gameStore.startNewRun(archetypeId)` y navega a `/map` en `src/views/DeckSelectionView.vue` (depende de T011, T045)
- [X] T047 [US3] Actualizar `RewardScreen.vue` para ofrecer selección de cartas del `lootPool` del jefe derrotado (mostrar **2 cartas aleatorias**, el jugador elige 1, se llama `deckStore.addCard`) en `src/views/RewardScreen.vue` (depende de T030, T043)
- [X] T048 [US3] Añadir manejo de eventos de tienda en `EventModal.vue`: cuando `event.type === 'shop'`, renderizar catálogo generado por `ShopSystem.generateShopCatalog` con `CardShopItem.vue`, manejar compra con `playerStore.spendGold` y `deckStore.addCard` en `src/components/events/EventModal.vue` (depende de T043, T045) *(implementado en `EventWindow.vue` + `MapView.vue`)*

**Checkpoint**: El flujo completo `DeckSelectionView → MapView → (evento tienda) → compra de carta` funciona. Las stats del jugador cambian al adquirir cartas Pasivas. Los 2 tests pasan en verde.

---

## Phase 6: User Story 4 — Progresión Completa hasta Fathom's End (Priority: P4)

**Objetivo**: El jugador puede completar el ciclo completo: islas regulares → gate de jefe (después de 5) → 3 islas de jefe → isla final única, con cada jefe principal dando una carta única y la victoria mostrando el resumen.

**Independent Test**: Simular el estado `regularIslandsCompleted=5` y verificar que `MapGenerator` devuelve solo islas de jefe; simular `bossIslandsDefeated.length=3` y verificar que solo devuelve la isla final.

- [X] T049 [P] [US4] Extender `MapGenerator` con `generateBossGateOptions(bossBank, defeatedBossIds)` (devuelve 3 islas de jefe excluyendo las ya derrotadas) en `src/engine/simulation/MapGenerator.js`
- [X] T050 [P] [US4] Extender `MapGenerator` con `generateFinalGateOption(finalIsland)` (devuelve solo `Fathom's End` cuando `bossIslandsDefeated.length >= 3`) en `src/engine/simulation/MapGenerator.js`
- [ ] T051 [P] [US4] Añadir datos de cartas únicas para cada jefe principal y datos del jefe final con su carta de mayor rareza en `src/assets/data/bosses.json` y `src/assets/data/cards.json`
- [X] T052 [US4] Implementar `VictoryView.vue` (pantalla de victoria con: resumen de la partida — islas completadas, cartas adquiridas, carta del jefe final obtenida — y botón "Jugar de Nuevo" que navega a `/`) en `src/views/VictoryView.vue`
- [X] T053 [US4] Actualizar `gameStore.resolveCombatVictory()` para: incrementar `regularIslandsCompleted` o agregar a `bossIslandsDefeated[]` según `currentBoss.isMajor`; agregar carta única del jefe a `pendingRewards` cuando `isMajor=true`; navegar a `VictoryView` cuando se derrota el jefe final en `src/stores/gameStore.js`

**Checkpoint**: Una partida completa puede jugarse de principio a fin. Después de 5 islas regulares solo aparecen islas de jefe. Después de 3 jefes, solo aparece Fathom's End. La victoria muestra el resumen correcto.

---

## Phase 7: User Story 5 — Eventos de Mar entre Islas (Priority: P5)

**Objetivo**: Mientras el barco navega libremente por el mapa, existe una pequeña probabilidad de disparar un evento oceánico cada X píxeles recorridos. El evento congela el barco, se resuelve como cualquier otro evento, y el barco resume su movimiento. En un juego completo (start → VictoryView) el jugador debería encontrar ~2 eventos de mar.

**Arquitectura**: El barco NO tiene un "destino" — se mueve libremente. Los eventos de mar son probabilísticos basados en **distancia acumulada viajada**, no en islas visitadas.

**Independent Test**: Inyectar un evento de mar forzado durante la navegación, verificar que el barco se congela, el evento se resuelve, y el barco resume movimiento normalmente.

### Tests — User Story 5

- [ ] T054 [P] [US5] Escribir tests unitarios para `SeaEventTrigger` (probabilidad acumulativa por píxeles: cada 150 px se evalúa probabilidad ~7%, esperando ~2 eventos en 4000 px totales de navegación típica; `checkTrigger(distanceTraveled, rng)` retorna boolean, `calculateCumulativeProbability(pixelDistance)` lineal) en `tests/unit/engine/SeaEventTrigger.test.js`

### Implementación — User Story 5

- [ ] T055 [P] [US5] Implementar `SeaEventTrigger.js` con: `calculateCumulativeProbability(cumulativePixels)` (fórmula: probabilidad acumulativa para disparar evento raro ~10-20% en game completo), `checkTrigger(cumulativePixels, rng)` (compara RNG contra probabilidad), y `resetTrigger()` (limpia estado tras evento) en `src/engine/simulation/SeaEventTrigger.js`
- [ ] T056 [P] [US5] Separar eventos de mar en JSON: crear sección `seaEvents[]` dentro de `src/assets/data/events.json` con ≥5 eventos de mar (marcados con `biome: 'sea'`, `isSeaEvent: true`); incluir ≥2 con outcomes de penalización (`type: 'debuff'` con `{ type: 'damage'|'speed'|'hp', magnitude: 0.1–0.3, expireAfterCombat: true }`) y mostrar probabilidades en opciones
- [ ] T057 [P] [US5] Integrar disparador de eventos de mar en `MapView.vue`: rastrear `cumulativePixelsTraveled` desde inicio de exploración, en cada frame del animation loop llamar `seaEventTrigger.checkTrigger(cumulativePixelsTraveled, Math.random())`, si dispara → seleccionar evento de mar aleatorio, congelar barco (`pauseShipMovement = true`), mostrar EventWindow con el evento, resolver decisión, aplicar débuffs a `gameStore.pendingDebuffs[]`, resumir movimiento normal en `src/views/MapView.vue`
- [ ] T058 [P] [US5] Actualizar `DebuffIndicator.vue` para mostrar débuffs activos del jugador con iconos y magnitud (e.g., "⚔️ -20% daño"); integrar en `CombatView.vue` HUD durante combate; validar que débuffs de mar desaparecen al terminar combate (mediante `clearCombatDebuffs()`) en `src/components/hud/DebuffIndicator.vue`

**Checkpoint**: Navegando libremente por el mapa, cada ~4000 píxeles de navegación típica disparar ~2 eventos de mar. El barco se congela, se resuelve el evento, débuffs se aplican y se muestran en combate, luego se limpian correctamente.

---

## Phase 9: B1 — Capitán Cangrejo (Implementación Completa)

**Objetivo**: Implementar al Capitán Cangrejo exactamente como lo describe `src/assets/concept/boss-design.md`: HP 900, 4 patrones de ataque (2 zarpazos estáticos, 1 cascada con hitbox móvil, 1 golpe de suelo con zonas dinámicas). Cada tarea es autocontenida y tiene un criterio de verificación claro.

**Input de diseño**: `src/assets/concept/boss-design.md` — sección B1. Leer antes de implementar cualquier tarea de esta fase.

**Independent Test**: Navegar a `/combat` con `crab_captain` cargado en `gameStore.currentBoss`. Los 4 patrones se deben telegrafiar y disparar correctamente. Victoria al acumular 900 dmg total al jefe.

---

### Paso 1 — Datos (sin tocar el motor)

- [ ] T063 [P] Reescribir la entrada `crab_captain` en `src/assets/data/bosses.json` con los valores finales del diseño (2026-05-26): `hp/maxHp: 900`; campo raíz `attackCooldown: { min: 300, max: 2000 }`; 4 patrones con `weight`, `damage`, `telegraphDurationMs`, `zones` y campos especiales (`motion`, `directionMode`, `rockZoneCandidates`, `dynamicZones`) según spec; `lootPool` con solo Puño Salado (Escudo de Concha es de tienda, no dropea el jefe) — `src/assets/data/bosses.json`

  **Datos exactos a escribir** (extraídos de boss-design.md, sesión 2026-05-26):
  ```json
  {
    "id": "crab_captain", "name": "Capitán Cangrejo", "isMajor": false,
    "hp": 900, "maxHp": 900, "spriteKey": "boss_crab_captain",
    "attackCooldown": { "min": 300, "max": 2000 },
    "attackPatterns": [
      { "id": "claw_swipe_left",  "damage": 10, "telegraphDurationMs": 700, "weight": 40,
        "zones": [{ "x": 0,   "y": 200, "width": 530, "height": 200 }] },
      { "id": "claw_swipe_right", "damage": 10, "telegraphDurationMs": 700, "weight": 40,
        "zones": [{ "x": 430, "y": 200, "width": 530, "height": 200 }] },
      { "id": "bubble_cascade",   "damage": 12, "telegraphDurationMs": 1400, "weight": 15,
        "zones": [{ "x": 0, "y": 150, "width": 150, "height": 300 }],
        "motion": { "fromX": 0, "toX": 810, "durationMs": 1400 },
        "directionMode": "random" },
      { "id": "ground_slam",      "damage": 20, "telegraphDurationMs": 2200, "weight": 5,
        "zones": [{ "x": 160, "y": 300, "width": 640, "height": 180 }],
        "rockDamage": 15,
        "rockZoneCandidates": [
          { "x": 100, "y": 150 }, { "x": 300, "y": 420 }, { "x": 500, "y": 160 }, { "x": 700, "y": 400 },
          { "x": 180, "y": 350 }, { "x": 600, "y": 300 }, { "x": 400, "y": 200 }, { "x": 820, "y": 160 }
        ],
        "dynamicZones": { "count": 4, "mode": "candidates", "zoneSize": 100 } }
    ],
    "lootPool": [
      { "cardId": "card_action_salty_fist" }
    ]
  }
  ```

  **Verificación**: `JSON.parse(fs.readFileSync('bosses.json'))` no lanza error; el objeto tiene `hp === 900`, `attackPatterns.length === 4`, `attackCooldown.min === 300`.

### Paso 1b — Selección ponderada y cooldown entre ataques

> Estas dos tareas extienden módulos ya completados (T024 y T026). No modifican comportamiento previo — solo agregan la nueva lógica cuando el campo correspondiente está presente en el JSON.

- [ ] T072 [P] Extender `pickPattern(eligible, rng)` en `src/engine/combat/AttackPatternSelector.js` para **selección ponderada**: si los patrones elegibles tienen el campo `weight`, hacer selección ponderada (suma pesos, generar `rng() * totalWeight`, iterar hasta acumular el umbral); si ningún patrón tiene `weight`, mantener el comportamiento anterior (uniforme); agregar test en `tests/unit/engine/AttackPatternSelector.test.js`: con pesos `[90, 5, 5]` y `rng=()=>0.0` → elige el primero; `rng=()=>0.91` → elige el segundo; `rng=()=>0.96` → elige el tercero — `src/engine/combat/AttackPatternSelector.js`

- [ ] T073 Implementar pausa `attackCooldown` en `src/engine/combat/CombatEngine.js`: después de que `fireAttack()` completa (y el daño se aplica), si `boss.attackCooldown` existe, esperar un tiempo aleatorio entre `attackCooldown.min` y `attackCooldown.max` ms antes de iniciar el siguiente `beginTelegraph()`; implementar con un flag `state.cooldownTimer` que el game loop descuenta en cada tick (en ms, usando `ticker.deltaMS`); **eliminar la constante `PATTERN_INTERVAL = 3000` y la variable `timeSinceLastAttack`** — reemplazarlas por el nuevo sistema de cooldown; si `boss.attackCooldown` no existe, usar `{ min: 3000, max: 3000 }` como fallback para mantener el comportamiento anterior — `src/engine/combat/CombatEngine.js`

---

### Paso 2 — Lógica pura (sin PixiJS, testeable)

- [ ] T064 [P] Crear función pura `computeMotionZone(baseZone, motion, directionMode, progress, rng)` en `src/engine/combat/MotionZone.js`: recibe la zona base `{x,y,width,height}`, el descriptor `motion:{fromX,toX,durationMs}`, `directionMode` (`"ltr"|"rtl"|"random"`), un progreso `progress` (0–1) y una función `rng`; si `directionMode === "random"` usa `rng` para elegir L→R o R→L en cada invocación; devuelve la zona con `x` interpolado linealmente entre `fromX` y `toX` según `progress`; exportar también `resolveDirection(directionMode, rng)` (devuelve `"ltr"` o `"rtl"`) — `src/engine/combat/MotionZone.js`

- [ ] T065 [P] Crear función pura `generateDynamicZones(spec, arenaW, arenaH, rng)` en `src/engine/combat/DynamicZoneGenerator.js`: recibe `spec:{count, mode, zoneSize, candidates?}`, dimensiones de arena y `rng`; **si `mode === "candidates"` y `spec.candidates` existe**, selecciona `count` entradas al azar de `candidates` (sin repetición) y devuelve zonas `{x: c.x, y: c.y, width: zoneSize, height: zoneSize}`; **si `mode === "random"`**, genera `count` zonas con posiciones aleatorias dentro de `[0, arenaW-zoneSize] × [0, arenaH-zoneSize]`; en ambos modos garantiza que ninguna zona se salga del canvas — `src/engine/combat/DynamicZoneGenerator.js`

---

### Paso 3 — Tests (escribir ANTES de integrar al motor)

- [ ] T066 [P] Escribir tests unitarios para `MotionZone.js`: `progress=0` → `x === fromX`; `progress=1` → `x === toX`; `progress=0.5` → `x` es el punto medio; `directionMode="ltr"` → siempre L→R; `directionMode="rtl"` → siempre R→L; `directionMode="random"` con `rng=()=>0` → L→R, con `rng=()=>0.9` → R→L; la `y`, `width` y `height` de la zona devuelta no cambian — `tests/unit/engine/MotionZone.test.js`

- [ ] T067 [P] Escribir tests unitarios para `DynamicZoneGenerator.js` en `tests/unit/engine/DynamicZoneGenerator.test.js`:
  - **Modo `random`**: genera exactamente `count` zonas; `width === zoneSize` y `height === zoneSize`; ninguna zona sale del canvas; mismo seed → mismo resultado; distinto seed → resultado diferente
  - **Modo `candidates`**: genera exactamente `count` zonas; todas las posiciones provienen del array `candidates`; no se repite la misma entrada del array en un mismo llamado; `width` y `height` iguales a `zoneSize`
  - **Caso límite**: si `mode === "candidates"` pero `candidates` no existe → lanza error descriptivo

---

### Paso 4 — Integración en el motor (CombatEngine)

> ⚠️ Hacer T066 y T067 pasar en verde antes de tocar el motor.

- [ ] T068 Extender `beginTelegraph()` en `src/engine/combat/CombatEngine.js` para soporte de hitbox móvil (`motion`):
  - Importar `computeMotionZone`, `resolveDirection` de `MotionZone.js`
  - Al iniciar un patrón con `pattern.motion`, llamar `resolveDirection(pattern.directionMode, Math.random)` y guardar en `state.currentDirection`; guardar el progreso inicial en `state.motionProgress = 0`
  - En el game loop (ticker), si `state.telegraphActive && state.currentPattern?.motion`: calcular `progress = 1 - state.telegraphTimer / state.currentPattern.telegraphDurationMs`; actualizar `state.activeZones[0]` con `computeMotionZone(base, motion, direction, progress)`; redibujar `telegraphGfx` con la zona actualizada
  - `state` necesita 2 nuevos campos: `currentDirection: null` y `motionProgress: 0`
  - **Ningún otro comportamiento del motor debe cambiar** — `src/engine/combat/CombatEngine.js`

- [ ] T069 Extender `beginTelegraph()` en `src/engine/combat/CombatEngine.js` para soporte de zonas dinámicas (`dynamicZones`):
  - Importar `generateDynamicZones` de `DynamicZoneGenerator.js`
  - Al iniciar un patrón con `pattern.dynamicZones`, llamar `generateDynamicZones(spec, 960, 540, Math.random)` donde `spec` incluye `pattern.rockZoneCandidates` si existe: `{ ...pattern.dynamicZones, candidates: pattern.rockZoneCandidates }` y guardar resultado en `state.rockZones`
  - Dibujar las zonas de roca en `telegraphGfx` como **círculos** (radio = `zoneSize/2`) con color distinto al telegraph normal (usar `COLORS.telegraph` con alpha 0.5 y borde punteado imitado con círculo + stroke)
  - En `fireAttack()`, si `state.currentPattern?.dynamicZones`, agregar `state.rockZones` a la colisión con daño `pattern.rockDamage ?? 15`; limpiar `state.rockZones = []` al terminar
  - `state` necesita 1 nuevo campo: `rockZones: []`
  - **Los zarpazos y patrones sin campos especiales deben comportarse exactamente igual que antes** — `src/engine/combat/CombatEngine.js`

---

### Paso 5 — Visual del jefe (sprite placeholder)

- [ ] T070 [P] Agregar rama condicional en la función de dibujo del jefe en `src/engine/combat/CombatEngine.js`: si `boss.spriteKey === "boss_crab_captain"`, dibujar al cangrejo con gráficos vectoriales PixiJS (cuerpo circular rojizo de ~160×140 px con dos pinzas laterales simétricas como rectángulos redondeados + ojos amarillos + patas decorativas); si no hay sprite cargado usar el fallback rectangular existente; la posición del jefe debe seguir siendo fija en `(ARENA_WIDTH/2, 130)` — `src/engine/combat/CombatEngine.js`

  > **Nota**: No bloquea la jugabilidad. Puede implementarse en paralelo con T068–T069. El sprite real se puede reemplazar después con un asset PNG real sin tocar la lógica.

---

### Paso 6 — Verificación final

- [ ] T071 Validación integral del Capitán Cangrejo: ejecutar `pnpm test` y verificar que T066 y T067 pasan; abrir `/combat` con `crab_captain` como jefe activo; confirmar visualmente que:
  1. `claw_swipe_left` telegrafía y golpea el lado izquierdo (x=0–530)
  2. `claw_swipe_right` telegrafía y golpea el lado derecho (x=430–960), la zona central x=430–530 es peligrosa para ambos
  3. `bubble_cascade` mueve el rectángulo de un extremo al otro durante 1400ms; la dirección cambia aleatoriamente entre usos
  4. `ground_slam` muestra 4 círculos de caída en posiciones distintas cada vez; el área central (x=160–800) también se telegrafía
  5. El jefe aguanta 90 ataques básicos sin modificadores antes de morir
  Documentar cualquier ajuste de balance en `boss-design.md` sección "Nota de balance post-playtesting" — validación manual

---

### Dependencias dentro de la fase

```
T063 (datos JSON)
    ↓
T064 [P]  T065 [P]  T072 [P]  T073   ← Paralelizables entre sí (todos requieren solo T063)
    ↓          ↓
T066 [P]  T067 [P]              ← Tests, paralelizables (requieren T064/T065 respectivamente)
    ↓          ↓
T068       T069                  ← Motor: T068 requiere T064+T066 ✓; T069 requiere T065+T067 ✓
    ↓          ↓
    └────┬──────┘
         ↓
        T070 [P]                 ← Visual (paralelizable, no bloquea jugabilidad)
         ↓
        T071 (validación final, requiere T063+T068+T069+T072+T073 completados)
```

**Checkpoint de la fase**: `pnpm test` pasa con T066 y T067 en verde. El combate contra `crab_captain` es completamente funcional con los 4 patrones. El jefe tiene 900 HP visibles en el HUD.

---

## Phase 8: Polish & Concerns Transversales

**Objetivo**: Integración visual completa, contador de oro en HUD, verificación de cobertura 100% y Docker listo.

- [x] T059 [P] Implementar `GoldCounter.vue` (muestra `playerStore.gold` reactivo con icono de moneda) e integrarlo en `CombatView.vue` y `MapView.vue` como parte del HUD en `src/components/hud/GoldCounter.vue`
- [x] T060 [P] Integrar `DeckViewer.vue` en `MapView.vue` como panel lateral colapsable (disponible fuera del combate, FR-011) activado por botón "Ver Mazo" en `src/views/MapView.vue`
- [ ] T061 Ejecutar `pnpm test --coverage` y verificar que todos los módulos en `src/engine/` tienen cobertura de tests en flujos normales y casos límite según plan.md sección 12 (SC-005); corregir cualquier módulo sin cobertura
- [ ] T062 Verificar que la imagen Docker se construye con `docker build -t fathoms-end .` y el servidor Nginx sirve la app correctamente en menos de 2 minutos en entorno limpio (SC-008)

**Checkpoint Final**: `pnpm lint && pnpm test --coverage && pnpm build` pasan sin errores. El CI completa en < 5 minutos. Docker despliega correctamente.

---

## Resumen de Dependencias entre Historias

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational: entidades + stores + router)
    ↓              ↓              ↓
Phase 3 (US1)  Phase 4 (US2)  Phase 5 (US3)    ← Paralelizables entre sí
    ↓              ↓              ↓
    └──────────────┴──────────────┘
                   ↓
            Phase 6 (US4)     ← Requiere US1 + US2 + US3 integrados
                   ↓
            Phase 7 (US5)     ← Requiere US2 (MapView funcional)
                   ↓
            Phase 8 (Polish)
                   ↓
            Phase 9 (B1 Capitán Cangrejo)  ← Requiere Phase 3 (CombatEngine funcional)
```

**Nota**: US1, US2 y US3 son independientes entre sí una vez completada la Phase 2. Pueden implementarse en paralelo por distintos desarrolladores.

---

## Ejemplos de Ejecución Paralela

### Ventana A (US1 — Combat MVP)
```
T020 → T021 → T022 (tests)
T023 → T024 → T025 → T026 → T027 → T028 → T029 → T030 → T031
```

### Ventana B (US2 — Map, comienza cuando Phase 2 termina)
```
T032 → T033 (tests)
T034 → T035 → T036 → T037 → T038 → T039 → T040
```

### Ventana C (US3 — Deck, comienza cuando Phase 2 termina)
```
T041 → T042 (tests)
T043 → T044 → T045 → T046 → T047 → T048
```

---

## Conteo Total de Tareas

| Fase | Tareas | Historia |
|---|---|---|
| Phase 1: Setup | 8 (T001–T008) | — |
| Phase 2: Foundational | 11 (T009–T019) | — |
| Phase 3: Combat | 12 (T020–T031) | US1 (P1) 🎯 MVP |
| Phase 4: Map Navigation | 9 (T032–T040) | US2 (P2) |
| Phase 5: Deck Building | 8 (T041–T048) | US3 (P3) |
| Phase 6: Full Progression | 5 (T049–T053) | US4 (P4) |
| Phase 7: Sea Events | 5 (T054–T058) | US5 (P5) |
| Phase 8: Polish | 4 (T059–T062) | — |
| **TOTAL** | **62 tareas** | |

**Alcance MVP sugerido**: Completar Phase 1 + Phase 2 + Phase 3 (US1). Con T001–T031 el juego es jugable como demo de combate independiente.

---

*Generado: 2026-05-04 | Rama: `001-fathoms-end-core`*
