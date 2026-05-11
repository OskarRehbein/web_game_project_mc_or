# Revision Oskar — Semana 3 (Phase 4: Mapa de Islas)

**Fecha del analyze**: 2026-05-11  
**Semana del proyecto**: Semana 3 (8–14 Mayo)  
**Feature**: `001-fathoms-end-core`  
**Responsable revisado**: Oskar  
**Scope**: Phase 4 (US2 — Navegación del Mapa de Islas, T032–T040)  
**Reviewer**: GitHub Copilot (speckit.analyze)

---

## Contexto

Al inicio de la Semana 3, Oskar entregó trabajo base de mapa como adelanto del cierre de Semana 2. Se analizó la coherencia entre ese trabajo y los artefactos `spec.md`, `plan.md` y `tasks.md` de la feature.

### Archivos producidos por Oskar

| Archivo | Descripción |
|---------|-------------|
| `src/engine/entities/Island.js` | Entidad Island con tipos visuales (forest/desert/rock) |
| `src/engine/entities/Ship.js` | Entidad Ship con movimiento en canvas |
| `src/views/MapView.vue` | Canvas 2D con barco navegable, spacebar para interactuar |
| `src/components/EventWindow.vue` | Ventana de evento (ubicación y nombre fuera de plan) |

---

## Hallazgos

### 🔴 CRÍTICOS (resolver antes de continuar Phase 4)

#### I1 — Island.js usa tipos visuales en lugar de tipos lógicos
- **Archivo**: `src/engine/entities/Island.js`
- **Problema**: `Island.type` implementado como `'forest' | 'desert' | 'rock'` (tema visual). El spec exige `'regular' | 'boss' | 'final'` (tipo lógico de juego). Además faltan los atributos `events[]`, `isCompleted`, `isDiscarded`, `bossId?` definidos en `spec.md:Key Entities`.
- **Impacto**: Los datos de `islands.json` (T036) y la lógica de `MapGenerator.js` (T035) son incompatibles con esta implementación.
- **Recomendación**: Reescribir `Island.js` con el modelo del spec. Los temas visuales (color por tipo de terreno) pueden ser un helper interno, pero `type` debe ser `'regular' | 'boss' | 'final'`.

#### I2 — MapView.vue tiene enfoque incompatible con el spec
- **Archivo**: `src/views/MapView.vue`
- **Problema**: La vista implementa un canvas libre donde el barco navega con teclado y se acerca a islas para interactuar con spacebar. El spec (FR-023, US2 AC1) exige "exactamente 3 islas aleatorias **seleccionables**" — es una interfaz de selección de nodos, no exploración libre.
- **Impacto**: Todo el sistema de input (keysPressed, gameLoop, SHIP_SPEED) es trabajo que no encaja en la arquitectura definida.
- **Recomendación**: La MapView de producción debe renderizar 3 `IslandNode.vue` seleccionables (T039 → T040). El canvas libre puede descartarse o usarse como animación de fondo no interactiva.

---

### 🟠 ALTOS

#### I3 — Ship.js no existe en el spec ni en el plan
- **Archivo**: `src/engine/entities/Ship.js`
- **Problema**: `Ship` no tiene entidad correspondiente en `spec.md:Key Entities` ni en `plan.md`. Está en `/engine/entities/` mezclado con entidades de lógica pura.
- **Recomendación**: Decisión de equipo — si se mantiene como efecto visual/animación, moverlo fuera del engine (p.ej. usar directamente en la vista). No debe ser una entidad de lógica de juego.

#### I4 — EventWindow.vue tiene nombre y ubicación incorrectos
- **Archivo**: `src/components/EventWindow.vue`
- **Problema**: El plan especifica `src/components/events/EventModal.vue`. Nombre, ubicación y API (props/emits) son distintos. T038 pide `DecisionCard.vue`, `EventModal.vue` y `OutcomeDisplay.vue`.
- **Recomendación**: Mover y renombrar a `src/components/events/EventModal.vue`, o usar como base interna y construir `EventModal.vue` sobre ella antes de T038.

---

### 🟡 MEDIOS

#### C1 — Tests TDD de Phase 4 no escritos
- **Afecta**: T032 (MapGenerator), T033 (EventResolver)
- **Problema**: La metodología del proyecto exige escribir tests **antes** de implementar. T034 y T035 no pueden marcarse como completos sin sus tests previos.
- **Recomendación**: T032+T033 son el primer paso de esta semana.

#### C2 — src/engine/simulation/ vacío
- **Afecta**: T034 (EventResolver.js), T035 (MapGenerator.js)
- **Problema**: Directorio vacío. Sin estas implementaciones T040 no puede completarse.
- **Recomendación**: Implementar en orden: T034 → T035 → T040.

#### C3 — Faltan islands.json, events.json, cards.json
- **Afecta**: T036, T037, T044
- **Problema**: `src/assets/data/` solo contiene `bosses.json`. Los tres JSONs son necesarios para que MapView, EventModal y DeckSelection funcionen.
- **Recomendación**: Generar los tres JSONs siguiendo exactamente los modelos de `spec.md:Key Entities`.

#### C4 — src/components/map/ vacío
- **Afecta**: T039 (IslandNode.vue, MapCanvas.vue)
- **Problema**: Sin estos componentes T040 (MapView completo) no puede implementarse.
- **Recomendación**: Crear componentes de mapa antes de MapView.

#### U1 — Conflicto de datos entre Island.js actual y islands.json futuro
- **Afecta**: T036
- **Problema**: Si `islands.json` se genera con `type: 'regular'|'boss'|'final'` pero `Island.js` espera `'forest'|'desert'|'rock'`, los datos son incompatibles.
- **Recomendación**: Resolver I1 **antes** de generar `islands.json`.

---

### 🟢 BAJOS

#### T1 — tasks.md no refleja avance real de Oskar
- `tasks.md` marca T039–T040 como `[ ]` pero `PROGRESS.md` dice "T039-T040 parcial".
- Considerar añadir nota en tasks.md indicando trabajo base existente (pero incompatible).

#### T2 — VictoryView.vue existe sin task completado
- `VictoryView.vue` existe como placeholder vacío. Verificar que no tiene lógica no testeada.

---

## Coverage — Phase 4 al inicio de Semana 3

| Task | Descripción | Código existente | Estado real |
|------|-------------|-----------------|-------------|
| T032 | Tests MapGenerator | ❌ | No iniciado |
| T033 | Tests EventResolver | ❌ | No iniciado |
| T034 | EventResolver.js | ❌ | No iniciado |
| T035 | MapGenerator.js | ❌ | No iniciado |
| T036 | islands.json | ❌ | No iniciado |
| T037 | events.json | ❌ | No iniciado |
| T038 | DecisionCard, EventModal, OutcomeDisplay | ⚠️ Parcial | EventWindow.vue (raíz, API distinta) |
| T039 | IslandNode.vue, MapCanvas.vue | ❌ | No iniciado |
| T040 | MapView.vue completo | ⚠️ Parcial incompatible | Canvas libre ≠ selección de nodos |

**Coverage Phase 4**: 0/9 tareas completas (2/9 con trabajo parcial incompatible)

---

## Código sin task correspondiente (unmapped)

| Archivo | Task más cercano | Problema |
|---------|-----------------|---------|
| `src/engine/entities/Island.js` | — | No es task explícito; modelo incompatible con spec |
| `src/engine/entities/Ship.js` | — | No existe en spec ni tasks |
| `src/components/EventWindow.vue` | T038 | Ubicación y nombre incorrectos según plan |

---

## Orden de ejecución recomendado para Semana 3

```
1. Reescribir Island.js (I1)
2. T032 + T033  → Tests TDD (MapGenerator, EventResolver)
3. T034 + T035  → EventResolver.js + MapGenerator.js
4. T036 + T037  → islands.json + events.json
5. T038 + T039  → Componentes events/ y map/
6. T040         → MapView.vue completo (reemplaza canvas libre)
```

---

## Próximos analyzes pendientes

- [ ] **Revisión Matías — Semana 3**: Verificar coherencia Phase 3 completada (T020–T031) contra spec/plan. Pendiente de ejecutar.
- [ ] **Revisión conjunta — Semana 4**: Verificar integración Phase 4 + Phase 5 antes de Phase 6.
