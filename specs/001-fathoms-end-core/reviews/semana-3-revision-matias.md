# Revisión Matías — Semana 3 (Phase 3: Sistema de Combate)

**Fecha del analyze**: 2026-05-11  
**Semana del proyecto**: Semana 3 (8–14 Mayo)  
**Feature**: `001-fathoms-end-core`  
**Responsable revisado**: Matías  
**Scope**: Phase 3 completa (US1 — Combate contra un Jefe, T020–T031) + Phase 2 (T009–T019)  
**Reviewer**: GitHub Copilot (speckit.analyze)

---

## Resumen ejecutivo

Phase 3 está **sustancialmente completa y bien implementada**. Todos los archivos requeridos existen, los tests TDD se escribieron antes de implementar, y la arquitectura respeta la separación Vue/PixiJS/engine puro definida en el plan. Se encontraron 2 inconsistencias funcionales a corregir, 2 items de implementación incompleta que corresponden a tareas futuras (normal), y 1 hallazgo positivo de cobertura extra.

---

## Archivos entregados por Matías

| Archivo | Task | Estado |
|---------|------|--------|
| `tests/unit/engine/DamageCalculator.test.js` | T020 | ✅ Completo (13 tests) |
| `tests/unit/engine/AttackPatternSelector.test.js` | T021 | ✅ Completo (10 tests) |
| `tests/unit/stores/playerStore.test.js` | T022 | ✅ Completo (17 tests) |
| `tests/unit/engine/CollisionSystem.test.js` | — | ✅ Extra (12 tests, no pedido en T025) |
| `src/engine/combat/DamageCalculator.js` | T023 | ✅ Completo |
| `src/engine/combat/AttackPatternSelector.js` | T024 | ✅ Completo |
| `src/engine/combat/CollisionSystem.js` | T025 | ✅ Completo |
| `src/engine/combat/CombatEngine.js` | T026 | ✅ Completo |
| `src/assets/data/bosses.json` | T027 | ⚠️ Ver I1 |
| `src/components/hud/HealthBar.vue` | T028 | ✅ Completo |
| `src/components/hud/BossHealthBar.vue` | T028 | ✅ Completo |
| `src/components/hud/CooldownIndicator.vue` | T028 | ✅ Completo |
| `src/views/CombatView.vue` | T029 | ✅ Completo |
| `src/views/RewardScreen.vue` | T030 | ⚠️ Ver C1 (Phase 5) |
| `src/views/GameOverView.vue` | T031 | ✅ Completo |

**Phase 2 (T009–T019)**: Todo completo. `Card.js`, `Debuff.js`, `DeckArchetype.js`, `Player.js`, `Boss.js`, stores con TDD, Router, componentes shared, MainMenu.

---

## Hallazgos

### 🔴 CRÍTICOS

*Ninguno.*

---

### 🟠 ALTOS

#### I1 — bosses.json usa hpThreshold contradiciéndose con el spec
- **Archivo**: `src/assets/data/bosses.json`
- **Problema**: El spec establece explícitamente: *"En esta versión inicial, ningún patrón usa hpThreshold; el motor los trata todos como activos."* Sin embargo, `crab_captain` tiene dos patrones con `hpThreshold`:
  - `bubble_barrage`: `hpThreshold: 0.5` → solo activo cuando el jefe está por debajo del 50% HP
  - `shell_spin`: `hpThreshold: 0.25` → solo activo por debajo del 25%
- **Impacto funcional real**: Al iniciar combate con `crab_captain` a HP completo, `getEligiblePatterns()` solo devolverá `claw_swipe`. El jefe usa un único patrón repetido hasta el 50% de vida. Esto pasa silenciosamente sin error.
- **Por qué ocurrió**: La arquitectura de `AttackPatternSelector` soporta `hpThreshold` (es correcto diseñarlo así), pero los datos de jefes no debían usarlo aún.
- **Recomendación**: Quitar `hpThreshold` de los patrones de `crab_captain` en esta fase. Puede agregarse en una iteración futura cuando se implementen las fases de jefe formalmente. El Almirante Ahogado (`the_drowned_admiral`) está correcto: sus 3 patrones no tienen `hpThreshold` salvo `ghost_crew_rush` (hpThreshold: 0.5).

---

### 🟡 MEDIOS

#### C1 — RewardScreen.vue no ofrece selección de carta (previsto en T047, Phase 5)
- **Archivo**: `src/views/RewardScreen.vue`
- **Situación**: T030 pedía "muestra oro ganado y carta(s) obtenida, botón Continuar". Correcto. Pero T047 (Phase 5) requiere actualizar RewardScreen para que el jugador **elija 1 de 1–3 cartas aleatorias** del `lootPool`. La implementación actual muestra todas las cartas de `pendingRewards.cards` directamente, sin selección.
- **Impacto**: No bloqueante ahora (Phase 5 no ha empezado). Pero hay que tenerlo en cuenta: el formato actual de `pendingRewards.cards` es un array que se muestra directo, cuando Phase 5 necesita que solo se muestre el subconjunto aleatorio y el jugador elija uno.
- **Recomendación**: Anotar como deuda técnica. Al implementar T047, agregar la lógica de selección sin romper el display actual.

#### C2 — gameStore.resolveCombatVictory() incompleto para T053 (Phase 6)
- **Archivo**: `src/stores/gameStore.js`
- **Situación**: La implementación actual incrementa `regularIslandsCompleted` o pushea a `bossIslandsDefeated` según `isMajor`. Correcto para Phase 3. Pero T053 (Phase 6) requiere además:
  - Agregar `uniqueCard` del jefe a `pendingRewards` cuando `isMajor === true`
  - Navegar a `VictoryView` cuando `isFinalGate === true` tras el combate
- **Impacto**: No bloqueante ahora. Pero la carta única del Almirante Ahogado (`tidal_authority`) no se agrega actualmente como recompensa.
- **Recomendación**: Implementar en T053 de Phase 6. Dejar nota en el store.

#### U1 — DebuffIndicator inline en CombatView en lugar de componente separado
- **Archivo**: `src/views/CombatView.vue` (sección `.combat-view__debuffs`)
- **Situación**: Los débuffs activos se muestran con `v-for` directo en CombatView con función `debuffLabel()`. T058 (Phase 7) requiere `DebuffIndicator.vue` como componente independiente en `src/components/hud/`.
- **Impacto**: Bajo por ahora. Al implementar T058 habrá que extraer esa lógica.
- **Recomendación**: Cuando llegue T058, extraer el `v-for` + `debuffLabel()` a `DebuffIndicator.vue` y reemplazar en CombatView.

---

### 🟢 BAJOS / POSITIVOS

#### P1 — CollisionSystem tiene tests aunque no era requerido explícitamente
- `tests/unit/engine/CollisionSystem.test.js` (12 tests AABB) fue creado como cobertura extra.
- T025 no pedía test file. Esto supera el requisito mínimo de SC-005 para ese módulo. ✅

#### L1 — BossHealthBar muestra marcadores de fase en 50% y 25%
- Los marcadores visuales (`phaseMarkers: [0.5, 0.25]`) son informativos. No afectan lógica.
- La spec dice que `hpThreshold` es "reservado para uso futuro" en datos, pero mostrarlo visualmente es anticiparse correctamente al UX futuro. Bajo riesgo.

#### L2 — VictoryView.vue y DeckSelectionView.vue como placeholders
- Existen como vistas vacías o base. Normal para Phase 3. Las implementaciones completas son T046 (Phase 5) y T052 (Phase 6) respectivamente.

---

## Coverage — Phase 3 (US1)

| Task | ¿Código existe? | ¿Spec alineado? | Notas |
|------|----------------|----------------|-------|
| T020 Tests DamageCalculator | ✅ (13 tests) | ✅ | TDD previo a impl |
| T021 Tests AttackPatternSelector | ✅ (10 tests) | ✅ | TDD previo a impl |
| T022 Tests playerStore | ✅ (17 tests) | ✅ | TDD previo a impl |
| T023 DamageCalculator.js | ✅ | ✅ | Fórmula FR-019 correcta |
| T024 AttackPatternSelector.js | ✅ | ✅ | hpThreshold soportado |
| T025 CollisionSystem.js | ✅ | ✅ | + tests extra |
| T026 CombatEngine.js | ✅ | ✅ | PixiJS v8, telegraph, destroy |
| T027 bosses.json | ⚠️ | ❌ | I1: hpThreshold en datos |
| T028 HUD components | ✅ | ✅ | Los 3 componentes completos |
| T029 CombatView.vue | ✅ | ✅ | Canvas + HUD overlay |
| T030 RewardScreen.vue | ⚠️ | ~✅ | Completo para Phase 3; T047 pendiente |
| T031 GameOverView.vue | ✅ | ✅ | Stats + retry + menu |

**Coverage Phase 3**: 11/12 completos, 1 con dato inconsistente (I1 corregible en 5 min)

---

## Acción inmediata recomendada

Solo **un fix necesario antes de continuar**:

### Fix I1 — Quitar hpThreshold de crab_captain

En `src/assets/data/bosses.json`, en el jefe `crab_captain`:
- `bubble_barrage`: eliminar `"hpThreshold": 0.5`
- `shell_spin`: eliminar `"hpThreshold": 0.25`

El jefe `the_drowned_admiral` (isMajor) tiene `ghost_crew_rush` con `hpThreshold: 0.5` — también debería quitarse para ser consistente con el spec, aunque al ser jefe principal tiene menos exposición en el MVP.

---

## Próximos analyzes pendientes

- [ ] **Revisión conjunta Matías + Oskar — Semana 3 cierre**: Verificar integración Phase 3 (combate) + Phase 4 (mapa) cuando T040 esté completo.
- [ ] **Revisión Matías — Semana 4**: Phase 5 (Mazo), verificar T041–T048.
