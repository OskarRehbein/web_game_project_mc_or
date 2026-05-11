# PROGRESS.md — Fathom's End: Resumen de Avance

Archivo de referencia rápida. Describe qué hace cada bloque de tareas, su estado y quién lo trabaja.

---

## ¿Quién hace qué?

| Área | Responsable |
|------|-------------|
| Sistema de Combate (entidades, motor PixiJS, HUD) | Matías (tú) |
| Exploración de Islas, Mapa, Eventos narrativos | Oskar |
| Setup / Infraestructura compartida | Ambos |

---

## 🖼️ ¿Y los assets visuales (sprites, imágenes)?

**Los JSON de datos del juego** (`bosses.json`, `cards.json`, `islands.json`, `events.json`) los generamos nosotros como parte de las tareas de código — están definidos en el plan.

**Los sprites visuales** (personaje del jugador, jefes, efectos) son responsabilidad del equipo (tú o Oskar). La arquitectura asume que existen en `/src/assets/sprites/` en formato compatible con PixiJS (PNG o spritesheet).

**Durante el desarrollo** (semanas 2 y 3) usaremos **rectángulos de color** como placeholder en PixiJS para que todo funcione sin esperar los sprites finales. Los sprites reales se reemplazan en Semana 4 (pulido final).

> 💡 Puedes crear sprites simples con cualquier herramienta (Aseprite, Figma, hasta Paint) y exportarlos como PNG. El motor solo necesita la ruta del archivo.

---

## Fases y bloques de tareas

### ✅ Phase 1 — Setup (Semana 1, completo)
**Objetivo**: Proyecto inicializado con todas las herramientas listas.

| Tarea | Descripción |
|-------|-------------|
| T001 | Estructura de carpetas (`src/engine`, `src/stores`, `src/views`, etc.) |
| T002 | `package.json` con todas las dependencias (Vue 3, PixiJS v8, Pinia, Vitest, ESLint) |
| T003 | Vite configurado con alias `@` y plugin Vue |
| T004 | Vitest configurado con entorno jsdom y alias `@` |
| T005 | ESLint con reglas `vue3-recommended` |
| T006 | Dockerfile multi-stage (Node build → Nginx serve) |
| T007 | Pipeline CI/CD en GitHub Actions (lint → test → build) |
| T008 | `src/main.js` y `src/App.vue` con Vue + Pinia + Router montados |

**Resultado**: `pnpm dev` levanta el servidor, `pnpm test` corre sin errores, `pnpm lint` en verde.

---

### ✅ Phase 2 — Foundational (Semana 2, completo)
**Objetivo**: Todas las entidades puras, stores de Pinia y router. Ninguna historia de usuario puede comenzar sin esto.

#### Entidades del motor (`src/engine/entities/`) — JS puro, sin Vue ni PixiJS

| Tarea | Archivo | Qué hace |
|-------|---------|----------|
| T009 ✅ | `Card.js` | Define la entidad `Card` (id, name, type, rarity, effect, cost, cooldown) y la fábrica `createCard()` que valida todos los campos |
| T010 ✅ | `Debuff.js` | Define la entidad `Debuff` (type, magnitude, expireAfterCombat) y `createDebuff()`. Los debuffs se aplican por eventos de mar y expiran al terminar el siguiente combate |
| T011 ✅ | `DeckArchetype.js` | Define los 3 arquetipos iniciales (`action`, `balanced`, `exploration`) con sus cartas de inicio fijas. El jugador elige uno al comenzar cada partida |
| T012 ✅ | `Player.js` | Clase `Player` con stats base (HP=100, damage=10, speed=200px/s) y `computeStats(passiveCards)` que aplica bonos de Pasivas y penalizaciones de debuffs según la fórmula `(base + flat) × mult × debuffMult` |
| T013 ✅ | `Boss.js` | Clase `Boss` con `createBoss()` que valida que todos los `AttackPattern` tengan `telegraphDurationMs ≥ 1000 ms` (requisito de fair play) |

#### Stores de Pinia (`src/stores/`)

| Tarea | Archivo | Qué hace |
|-------|---------|----------|
| T022 ✅ | `playerStore.test.js` | 17 tests unitarios escritos **antes** de implementar (TDD): reset, applyDamage, heal, spendGold, addGold, clearCombatDebuffs |
| T014 ✅ | `playerStore.js` | Store reactivo del jugador: HP, oro, debuffs activos. Getter `stats(passiveCards)` calcula daño/velocidad/maxHp en tiempo real. Lanza error si se intenta gastar más oro del disponible |
| T042 ✅ *(adelantada de Phase 5)* | `deckStore.test.js` | 15 tests: initWithArchetype para los 3 arquetipos, addCard, removeCard (solo una instancia), getters de filtrado por tipo. Originalmente planificada para Semana 3 (Phase 5), se hizo en Semana 2 con TDD del store |
| T015 ✅ | `deckStore.js` | Store del mazo: filtra cartas por tipo (action/passive/utility), `initWithArchetype()`, `addCard()`, `removeCard()` (consume una copia de Utilidad), `hasCard()` |
    | T016 ✅ | `gameStore.js` | Store central de la partida: fase actual, isla/jefe en curso, islas completadas, rewards pendientes. Guards de progresión (boss gate, final gate) |
| ✨ *bonus* | `gameStore.test.js` | 19 tests adicionales (no estaba en tasks.md): startNewRun, enterCombat, resolveCombatVictory, resolveGameOver, getters isBossGate/isFinalGate |

#### Infraestructura Vue

| Tarea | Qué hace |
|-------|----------|
| T017 ✅ | Vue Router con 7 rutas (`/`, `/deck-select`, `/map`, `/combat`, `/reward`, `/gameover`, `/victory`), lazy-loading, guard que bloquea `/combat` fuera de combate |
| T018 ✅ | Componentes compartidos: `Button.vue`, `Modal.vue`, `ProbabilityBadge.vue` |
| T019 ✅ | `MainMenu.vue` — pantalla de título con botón "Nueva Partida" |

---

### ✅ Phase 3 — User Story 1: Combate (Semana 2, completo)
**Objetivo**: Ventana de combate jugable con movimiento, cartas, telegraph y victoria/derrota.

| Tarea | Qué hace |
|-------|----------|
| T020 ✅ | Tests para `DamageCalculator` (TDD primero) |
| T021 ✅ | Tests para `AttackPatternSelector` (TDD primero) |
| T023 ✅ | `DamageCalculator.js` — fórmula `(base + flat) × mult × debuffMult` |
| T024 ✅ | `AttackPatternSelector.js` — filtra patrones por `hpThreshold` y elige uno aleatoriamente |
| T025 ✅ | `CollisionSystem.js` — detección AABB entre hitboxes (+ tests) |
| T026 ✅ | `CombatEngine.js` — game loop PixiJS a 60 FPS, telegraph visual ≥1s, sprites, plataformas |
| T027 ✅ | `bosses.json` — datos de al menos 2 jefes (1 menor + 1 principal) |
| T028 ✅ | HUD: `HealthBar.vue`, `BossHealthBar.vue`, `CooldownIndicator.vue` |
| T029 ✅ | `CombatView.vue` — canvas PixiJS + overlay HUD Vue |
| T030 ✅ | `RewardScreen.vue` — oro y cartas obtenidas, botón continuar |
| T031 ✅ | `GameOverView.vue` — pantalla de derrota con botón reiniciar |

---

### ⏳ Phase 4 — User Story 2: Mapa de Islas (Semana 2–3, Oskar)
**Objetivo**: El jugador ve 3 islas, elige, lee el evento narrativo y toma decisiones con probabilidades visibles.

| Tarea | Qué hará |
|-------|----------|
| T032 | Tests para `MapGenerator` |
| T033 | Tests para `EventResolver` |
| T034 | `EventResolver.js` — RNG ponderado por `outcome.weight` (suma 100) |
| T035 | `MapGenerator.js` — genera 3 islas sin repetir la anterior |
| T036 | `islands.json` — ≥15 islas regulares, 6 jefe, 1 final |
| T037 | `events.json` — ≥10 eventos narrativos con decisiones y probabilidades |
| T038 | Componentes de evento: `DecisionCard.vue`, `EventModal.vue`, `OutcomeDisplay.vue` |
| T039 | Componentes de mapa: `IslandNode.vue`, `MapCanvas.vue` |
| T040 | `MapView.vue` — orquesta mapa + eventos + navegación a combate |

---

### ⏳ Phase 5 — User Story 3: Mazo de Cartas (Semana 3)
**Objetivo**: El jugador acumula cartas por combates, eventos y tienda. Las Pasivas modifican stats activamente.

| Tarea | Qué hará |
|-------|----------|
| T041 | Tests para `ShopSystem` |
| T043 | `ShopSystem.js` — valida compras (mínimo 15 monedas) y genera catálogo aleatorio |
| T044 | `cards.json` — ≥20 cartas (action, passive, utility, weapon, armor) |
| T045 | Componentes de cartas: `CardThumbnail.vue`, `DeckViewer.vue`, `CardShopItem.vue` |
| T046 | `DeckSelectionView.vue` — pantalla de elección de arquetipo al iniciar |
| T047 | `RewardScreen.vue` actualizado — selección de carta del loot del jefe |
| T048 | `EventModal.vue` actualizado — soporte de eventos de tienda |

---

### ⏳ Phase 6 — User Story 4: Progresión Completa (Semana 3)
**Objetivo**: Ciclo completo jugable de principio a fin (islas → jefes × 3 → Fathom's End).

| Tarea | Qué hará |
|-------|----------|
| T049 | `MapGenerator` — opciones de islas de jefe excluyendo ya derrotadas |
| T050 | `MapGenerator` — devuelve solo Fathom's End cuando se cumple condición final |
| T051 | Datos de cartas únicas por jefe en `bosses.json` y `cards.json` |
| T052 | `VictoryView.vue` — resumen de partida + botón "Jugar de Nuevo" |
| T053 | `gameStore.resolveCombatVictory()` — incrementa contadores, aplica cartas únicas, navega a victoria |

---

### ⏳ Phase 7 — User Story 5: Eventos de Mar (Semana 3)
**Objetivo**: Probabilidad creciente de evento oceánico al navegar entre islas; debuffs visibles en HUD.

| Tarea | Qué hará |
|-------|----------|
| T054 | Tests para `SeaEventRoller` |
| T055 | `SeaEventRoller.js` — fórmula `P = 0.10 + 0.35 × n/8` (10% inicio → 45% final) |
| T056 | Eventos de mar en `events.json` — ≥5 con `isSeaEvent: true`, al menos 2 con debuffs |
| T057 | `MapView.vue` actualizado — roll de evento de mar antes de procesar isla |
| T058 | `DebuffIndicator.vue` — lista de debuffs activos visible en HUD de combate |

---

### ⏳ Phase 8 — Polish & Cierre (Semana 4)
**Objetivo**: Integración visual completa, cobertura de tests 100%, Docker y CI listos.

| Tarea | Qué hará |
|-------|----------|
| T059 | `GoldCounter.vue` — contador de oro reactivo en HUD |
| T060 | `DeckViewer.vue` integrado en `MapView.vue` como panel colapsable |
| T061 | Verificar cobertura 100% de `src/engine/` con `pnpm test --coverage` |
| T062 | Verificar build Docker: imagen construida y Nginx sirviendo en < 2 min |

---

## Cronograma de assets visuales

| Asset | Cuándo se necesita | Quién | Nota |
|-------|--------------------|-------|------|
| `bosses.json` / `cards.json` / etc. | Semana 2–3 | Copilot (parte del código) | JSON de datos del juego |
| Sprite del jugador (PNG) | Semana 2 (combate) | Tú o Oskar | Placeholder: rectángulo azul |
| Sprites de jefes (PNG) | Semana 2 (combate) | Tú o Oskar | Placeholder: rectángulo rojo |
| Iconos de UI (cartas, oro, etc.) | Semana 3 (HUD) | Tú o Oskar | Placeholder: emoji o color sólido |
| Fondo del mapa / combate | Semana 3 | Tú o Oskar | Placeholder: color de fondo liso |

> Los placeholders permiten que todo el código funcione mientras los sprites reales no estén listos. Se reemplazan sin tocar lógica.
