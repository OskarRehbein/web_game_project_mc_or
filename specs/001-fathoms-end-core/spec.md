# Feature Specification: Fathom's End — Core Game

**Feature Branch**: `001-fathoms-end-core`  
**Created**: 2026-05-04  
**Status**: Draft  
**Input**: Full game design document (DESING.md) + user description

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Combat Encounter Against a Boss (Priority: P1)

El jugador entra en combate contra un jefe, esquiva patrones de ataque telegrafíados, usa cartas de acción con cooldown y derrota al enemigo para recibir recompensas.

**Why this priority**: El combate es el loop de feedback central del juego. Sin él, ninguna mecánica de progresión tiene propósito. Es el MVP más reducido que entrega valor jugable.

**Independent Test**: Se puede testear lanzando directamente la pantalla de combate (`CombatView`) con un jefe de datos ficticios, sin necesidad del mapa ni la exploración.

**Acceptance Scenarios**:

1. **Given** el jugador inicia la pantalla de combate con un jefe cargado, **When** el jugador mueve el personaje con teclado/ratón, **Then** el personaje se mueve en tiempo real a 60 FPS sin caídas de rendimiento.
2. **Given** el jugador tiene una carta de Acción en su mazo, **When** la activa durante el combate, **Then** la habilidad se ejecuta y el cooldown se muestra visualmente en la UI.
3. **Given** el jefe va a lanzar un ataque, **When** faltan al menos 1 segundo para el impacto, **Then** el ataque es telegrafíado visualmente (indicador, animación previa o zona de peligro).
4. **Given** el jugador reduce la vida del jefe a 0, **When** se confirma la derrota, **Then** se muestra la pantalla de recompensas con loot y/o carta obtenida.
5. **Given** la vida del jugador llega a 0, **When** se confirma la derrota, **Then** se muestra la pantalla de Game Over y se ofrece reiniciar.

---

### User Story 2 — Navegación del Mapa de Islas con Decisiones (Priority: P2)

El jugador ve 3 islas disponibles, elige una, lee el evento narrativo y toma una decisión informada sobre qué opción seguir, con las probabilidades de cada resultado visibles.

**Why this priority**: El loop de exploración es lo que da estructura roguelike a la aventura. Sin él, el combate es un juego aislado sin contexto.

**Independent Test**: Se puede testear lanzando `MapView` con un banco de islas pre-cargado y sin pasar por combate.

**Acceptance Scenarios**:

1. **Given** el jugador termina un evento de isla o inicia la aventura, **When** se carga la pantalla de mapa, **Then** se muestran exactamente 3 islas aleatorias seleccionables del banco prediseñado.
2. **Given** el jugador selecciona una isla, **When** entra al evento, **Then** se muestra la descripción narrativa y las opciones de decisión como tarjetas interactivas.
3. **Given** una decisión tiene resultados con probabilidades, **When** el jugador ve la tarjeta de decisión, **Then** los porcentajes (pesos) de cada resultado posible están visibles (ej. "50% botín / 50% trampa").
4. **Given** una decisión requiere una carta de Utilidad, **When** el jugador no tiene esa carta, **Then** la opción aparece bloqueada con el requisito indicado.
5. **Given** una decisión requiere una carta de Utilidad, **When** el jugador sí tiene esa carta y la selecciona, **Then** la carta se consume del mazo y el resultado garantizado se aplica.

---

### User Story 3 — Construcción del Mazo de Cartas (Priority: P3)

El jugador acumula cartas a lo largo de la partida a través de eventos, combates y tiendas, conformando un estilo de juego.

**Why this priority**: El mazo es el sistema de progresión. Sin él, todas las partidas son iguales y el juego carece de build variety.

**Independent Test**: Se puede testear aislando el sistema de adquisición de cartas: simular recompensas de combate y verificar que las cartas se agregan correctamente al estado del jugador.

**Acceptance Scenarios**:

1. **Given** el jugador inicia una nueva partida, **When** se presenta la pantalla de selección de mazo, **Then** los dos arquetipos ("Pirata", "Navegante") aparecen como opciones seleccionables con la composición por subtipo (no las cartas específicas, ya que se eligen al azar) visible antes de confirmar.
2. **Given** el jugador derrota a un jefe menor, **When** se resuelven las recompensas, **Then** se ofrecen una o más cartas aleatorias del pool correspondiente al nivel del jefe.
3. **Given** el jugador llega a un evento de tienda, **When** abre la tienda, **Then** ve una selección de cartas disponibles con su coste en oro.
4. **Given** el jugador tiene suficiente oro, **When** compra una carta en la tienda, **Then** la carta se agrega a su mazo y el oro se descuenta.
5. **Given** el jugador tiene una carta Pasiva equipada, **When** combate, **Then** los bonificadores de estadística de esa carta están aplicados activamente (más daño, más vida, etc.).
6. **Given** el jugador usa una carta de Utilidad en exploración, **When** se confirma su uso, **Then** la carta desaparece del inventario y el resultado prometido ocurre.

---

### User Story 4 — Progresión Completa hasta Fathom's End (Priority: P4)

El jugador completa el ciclo completo: islas regulares → isla de jefe × 3 → isla final, derrotando al jefe final.

**Why this priority**: Representa la experiencia de juego completa. Requiere que todas las mecánicas anteriores funcionen en conjunto.

**Independent Test**: Requiere integración de todas las historias anteriores; puede testarse en modo acelerado con un banco de islas reducido.

**Acceptance Scenarios**:

1. **Given** el jugador completa 3 islas regulares, **When** elige la siguiente isla, **Then** las 3 opciones presentadas son todas islas de jefe (no regulares).
2. **Given** el jugador derrota un jefe principal (isla de jefe), **When** se resuelven las recompensas, **Then** recibe exactamente una carta única exclusiva de ese jefe.
3. **Given** el jugador ha derrotado la isla de jefe, **When** intenta navegar, **Then** la única opción disponible es la isla final "Fathom's End".
4. **Given** el jugador derrota al jefe final, **When** se termina el combate, **Then** se muestra la pantalla de victoria con resumen de la partida.

---

### User Story 5 — Eventos de Mar entre Islas (Priority: P5)

Ocasionalmente, mientras el jugador navega hacia una isla, aparece un evento oceánico con decisiones y consecuencias.

**Why this priority**: Añade variedad y riesgo al tránsito entre islas; es aditivo al loop principal pero no bloqueante para el MVP.

**Independent Test**: Puede testarse inyectando un evento de mar forzado en la transición de navegación y verificando su flujo completo.

**Acceptance Scenarios**:

1. **Given** el jugador navega hacia una isla, **When** un evento de mar se dispara aleatoriamente, **Then** la navegación se interrumpe y se presenta el evento oceánico.
2. **Given** un evento de mar tiene resultado de penalización, **When** el jugador lo sufre, **Then** el debuff (reducción de daño/velocidad/vida) se aplica y persiste durante el siguiente combate.
3. **Given** un evento de mar presenta decisiones, **When** el jugador ve las opciones, **Then** las probabilidades de resultado son visibles, igual que en los eventos de isla.

---

### Edge Cases

- ¿Qué ocurre si el banco de islas prediseñadas se agota antes de generar las 3 opciones? → El sistema debe muestrear con reemplazo del pool de islas regulares, evitando repetir la isla inmediata anterior.
- ¿Qué sucede si el jugador tiene 0 cartas de Acción durante el combate? → El jugador puede pelear usando solo el ataque básico (click derecho); el combate no queda bloqueado.
- ¿Qué pasa si el jugador intenta usar una carta de Utilidad que ya no aplica al evento actual? → La carta permanece en el inventario; las opciones de utilidad solo aparecen en los eventos que las aceptan.
- ¿Qué ocurre si el jugador cierra el navegador durante un combate? → La partida no se guarda (roguelike sin persistencia); al reabrir se presenta el menú principal.
- ¿Qué pasa si el RNG produce la misma isla de jefe dos veces en la misma partida? → Las islas de jefe derrotadas se eliminan del pool; no pueden repetirse.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Fases y Flujo de Juego

- **FR-001**: El sistema DEBE soportar exactamente dos fases de juego: Exploración y Combate, con transiciones controladas entre ellas según el resultado de los eventos.
- **FR-002**: El sistema DEBE preservar el estado completo del jugador (HP, oro, mazo, posición en el mapa) durante todas las transiciones de fase.
- **FR-003**: El sistema DEBE permitir al jugador iniciar una nueva partida que resetea completamente el estado y genera un nuevo mapa.
- **FR-004**: El sistema DEBE mostrar una pantalla de Game Over cuando el HP del jugador llegue a 0 durante el combate, con opción de reiniciar.
- **FR-005**: El sistema DEBE mostrar una pantalla de Victoria al derrotar al jefe final, con resumen de la partida.

#### Sistema de Cartas

- **FR-006**: El sistema DEBE soportar tres tipos de carta: **Acción**, **Pasiva** y **Utilidad**, cada una con comportamiento exclusivo.
- **FR-007**: Las cartas de **Acción** DEBEN ser activables manualmente durante el combate y mostrar su cooldown restante como indicador visual.
- **FR-008**: Las cartas de **Pasiva** DEBEN aplicar sus modificadores de estadística automáticamente mientras estén en el mazo del jugador.
- **FR-009**: Las cartas de **Utilidad** DEBEN ser consumibles: desaparecen del inventario tras ser usadas en un evento de exploración.
- **FR-010**: Las cartas de Utilidad DEBEN desbloquear opciones de decisión adicionales en los eventos que las requieran, visibles como opciones bloqueadas cuando el jugador no las posee.
- **FR-011**: El jugador DEBE poder consultar su mazo completo (cartas, tipos, efectos) en cualquier momento fuera del combate.
- **FR-012**: Al iniciar una nueva partida, el jugador DEBE elegir uno de dos **arquetipos de mazo inicial** antes de entrar al mapa:
  - **"Pirata"**: 1 carta de Acción aleatoria + 1 carta de Utilidad aleatoria (orientado a combate directo).
  - **"Navegante"**: 1 carta Pasiva aleatoria + 1 carta de Utilidad aleatoria (orientado a resistencia y exploración).
  Las cartas concretas se eligen aleatoriamente del pool al confirmar la selección; la composición por subtipo es fija.

#### Fase de Combate

- **FR-013**: El motor de combate DEBE renderizar el estado del juego a 60 FPS de forma sostenida durante todo el encuentro.
- **FR-014**: El jugador DEBE poder moverse en el espacio de combate 2D con control preciso en tiempo real.
- **FR-015**: Los jefes DEBEN telegrafisar sus ataques antes de su activación, con un mínimo de 1 segundo de advertencia visual.
- **FR-016**: La barra de vida del jefe DEBE ser visible en todo momento durante el combate.
- **FR-017**: La barra de vida del jugador DEBE ser visible en todo momento durante el combate.
- **FR-018**: El espacio de combate DEBE ser una arena 2D abierta de estilo arcade bossfight: sin plataformas saltables. El jugador se mueve libremente por el suelo de la arena y el jefe es parte del escenario (no es alcanzable por colisión directa, solo recibe daño por cartas/ataque básico).
- **FR-019**: El daño del jugador al jefe DEBE calcularse como `daño_final = (damage_base + flat_bonus) × multiplicador`, donde `damage_base = 10`. Los bonos planos y los multiplicadores provienen de cartas Pasivas equipadas y pueden coexistir simultáneamente.
- **FR-020**: Las cartas de Acción usadas durante el combate DEBEN aplicar su efecto inmediatamente y entrar en cooldown hasta poder usarse nuevamente.
- **FR-020a**: Los controles de combate DEBEN ser: movimiento con **WASD** o flechas, **click izquierdo** sobre la hotbar (o teclas 1-4) para activar una carta de Acción, **click derecho** en cualquier zona de la arena para realizar el **ataque básico** (siempre disponible, sin cooldown significativo) en dirección al cursor.
- **FR-020b**: El ataque básico DEBE infligir `damage_base = 10` modificado por los mismos bonos pasivos que las cartas de Acción (`(10 + flat_bonus) × multiplicador`), y NO consume cartas ni recursos. Su único propósito es garantizar que el combate nunca quede bloqueado si el jugador no tiene cartas de Acción disponibles.
- **FR-021**: El combate DEBE terminar con victoria cuando el HP del jefe llegue a 0.
- **FR-022**: Al terminar un combate con victoria, el sistema DEBE calcular y mostrar las recompensas (oro, cartas) antes de retornar a la fase de exploración.

#### Fase de Exploración y Sistema de Decisiones

- **FR-023**: Al inicio de la aventura y tras completar cada isla, el sistema DEBE presentar exactamente 3 islas aleatorias del banco prediseñado como opciones de navegación.
- **FR-024**: Cada opción de isla DEBE mostrar su tipo (regular, jefe, final) y nombre antes de ser seleccionada.
- **FR-025**: Al ingresar a una isla, el sistema DEBE disparar su evento narrativo asociado.
- **FR-026**: Cada evento narrativo DEBE presentar sus decisiones como tarjetas interactivas con: texto narrativo, iconografía de resultado (oro, carta, peligro, jefe) y porcentajes de probabilidad de cada resultado posible.
- **FR-027**: El sistema de resolución de eventos DEBE aplicar el RNG únicamente sobre los pesos definidos por cada opción, no sobre la estructura del evento.
- **FR-028**: Los resultados anidados DEBEN ser soportados: una decisión puede generar un sub-evento o modificar un evento futuro predefinido.
- **FR-029**: El oro obtenido en eventos DEBE acumularse inmediatamente en el estado del jugador.

#### Generación del Mapa

- **FR-030**: El mapa DEBE generarse proceduralmente al inicio de cada partida desde un banco de islas prediseñadas.
- **FR-031**: Después de completar **3 islas regulares**, el sistema DEBE presentar 3 islas de jefe como opciones (el jugador elige 1; las otras 2 se descartan y no reaparecen).
- **FR-032**: Las islas de jefe descartadas NO DEBEN reaparecer en la misma partida.
- **FR-033**: Tras derrotar la isla de jefe de la partida (única), el sistema DEBE generar la isla final "Fathom's End" como única opción disponible.
- **FR-034**: Los eventos de mar DEBEN dispararse con una probabilidad que escala progresivamente a lo largo de la partida: comenzando en aproximadamente **10%** por travesía en las primeras islas, y aumentando gradualmente hasta **40–50%** cerca de la isla final. La progresión es continua (no escalonada en bloques fijos) y se calcula en función del número de islas completadas sobre el total estimado de la partida.
- **FR-035**: Los eventos de mar DEBEN seguir el mismo sistema de decisiones con probabilidades visibles que los eventos de isla.
- **FR-036**: Los debuffs aplicados por eventos de mar DEBEN indicarse claramente en el HUD antes del siguiente combate y expirar al terminar dicho combate.

#### Progresión y Economía

- **FR-037**: El jugador DEBE acumular oro de forma persistente durante toda la partida (no se resetea entre islas).
- **FR-038**: Los eventos de tienda DEBEN aparecer como islas regulares y antes de islas de jefe, ofreciendo un catálogo de cartas comprables con oro.
- **FR-039**: Los jefes menores (encontrados en islas regulares) DEBEN presentar 2 cartas aleatorias del pool de cartas al ser derrotados; el jugador elige 1 (o ninguna).
- **FR-040**: Los jefes principales (de islas de jefe) DEBEN otorgar exactamente una carta única que representa el poder del jefe derrotado.
- **FR-041**: El jefe final DEBE otorgar la carta de mayor rareza del juego al ser derrotado (mostrada en pantalla de victoria).
- **FR-048**: El jugador DEBE comenzar cada partida con **0 monedas de oro**; el primer combate de isla regular otorga entre 8 y 20 monedas.
- **FR-049**: Los rangos de loot de oro DEBEN respetar la siguiente escala de tensión económica:
  - Eventos regulares (sin combate): 5–15 monedas.
  - Combates menores (jefes de isla regular): 8–20 monedas.
  - Jefes principales (islas de jefe): 30–60 monedas.
- **FR-050**: La tienda DEBE ofrecer **Cartas** (Acción, Pasiva, Utilidad). Las categorías Armas y Armaduras están **fuera del alcance de esta entrega** y reservadas para versiones futuras.
- **FR-051**: Los precios de la tienda DEBEN seguir estas bandas:
  - Carta común: 15–25 monedas.
  - Carta rara: 40–70 monedas.
- **FR-052**: El ítem más barato de la tienda DEBE costar al menos **15 monedas**, garantizando que el jugador complete 2 o más combates/eventos antes de poder realizar cualquier compra (tensión económica intencional).
- **FR-053**: El pool total de cartas del juego comprende exactamente **9 cartas únicas**: 3 de Acción, 3 Pasivas y 3 de Utilidad. Todas deben estar explícitamente especificadas en `cards.json`.
- **FR-054**: El jugador NO recupera HP automáticamente al terminar un combate. La curación solo ocurre a través de: (a) resultados de eventos de isla/mar que otorguen curación, o (b) ítems de curación comprados en la tienda. Las cartas de recuperación de vida (tipo Pasiva, Acción o Utilidad) son una opción válida dentro del pool de 9 cartas.

#### Sistema Técnico

- **FR-042**: La lógica de juego (cálculo de daño, RNG, gestión del mazo, resolución de eventos) DEBE estar implementada como módulos JavaScript puros, sin acoplamiento con el framework de UI ni con el motor de renderizado.
- **FR-043**: El estado global del jugador (HP, oro, mazo, fase actual) DEBE ser accesible y reactivo desde cualquier componente de UI y desde el motor de combate.
- **FR-044**: El motor de renderizado de combate DEBE montarse dentro de un componente Vue y destruirse limpiamente al salir de la pantalla de combate.
- **FR-045**: Todos los módulos de lógica pura DEBEN contar con pruebas unitarias que cubran sus flujos normales y sus casos límite.
- **FR-046**: El pipeline CI/CD DEBE ejecutar el linter y las pruebas unitarias automáticamente en cada push al repositorio.
- **FR-047**: La aplicación DEBE ser empaquetable en una imagen Docker y desplegable de forma reproducible.

---

### Key Entities

- **Player**: Representa el estado del jugador en una partida. Atributos: `hp: number` (base 100), `maxHp: number` (base 100), `gold: number` (inicia en 0 cada partida), `deck: Card[]`, `activeDebuffs: Debuff[]`, `stats: { damage: number` (base 10), `speed: number` (base 200 px/s) }`. Los stats base son fijos; las cartas Pasivas aplican bonos planos y/o multiplicadores según `daño_final = (damage_base + flat_bonus) × multiplicador`.
- **Card**: Unidad base del sistema de cartas. Atributos: `id`, `name`, `type: 'action' | 'passive' | 'utility'`, `description`, `rarity`, `effect`, `cooldown?` (solo para acción), `cost: number` (coste en tienda; Carta común 15–25, Carta rara 40–70). *(Los tipos `'weapon'` y `'armor'` están reservados para versiones futuras; fuera del alcance de esta entrega.)*
- **Island**: Nodo del mapa. Atributos: `id`, `name`, `type: 'regular' | 'boss' | 'final'`, `events: Event[]`, `bossId?`, `isCompleted: boolean`, `isDiscarded: boolean`.
- **Event**: Evento narrativo de una isla o del mar. Atributos: `id`, `title`, `description`, `decisions: Decision[]`, `isSeaEvent: boolean`.
- **Decision**: Opción dentro de un evento. Atributos: `text`, `requirements: CardRequirement[]`, `outcomes: Outcome[]`.
- **Outcome**: Resultado ponderado de una decisión. Atributos: `weight: number` (suma de todos los pesos en una decisión = 100), `type: 'loot' | 'trap' | 'boss' | 'damage' | 'debuff' | 'subevent'`, `goldMin?`, `goldMax?`, `cardPool?`, `subOutcomes?: Outcome[]`, `bossId?`, `damage?`, `debuff?`.
- **Boss**: Entidad enemiga de combate. Atributos: `id`, `name`, `hp`, `maxHp`, `attackPatterns: AttackPattern[]`, `lootPool: Card[]`, `uniqueCard?: Card`, `isMajor: boolean`. Valores de HP por categoría: jefe menor (isla regular) `maxHp = 900`, jefe principal (isla de jefe) `maxHp = 400`, jefe final `maxHp = 800`. *(Nota: el HP de los jefes menores fue ajustado a 900 durante el diseño de B1 — Capitán Cangrejo — para una pelea de resistencia; los jefes principales y el final se actualizarán al diseñarse en boss-design.md.)* En esta versión inicial no existe phase-gating: todos los `AttackPattern[]` del jefe están activos desde el inicio del combate, independientemente del HP actual. La arquitectura (campo `hpThreshold?` en `AttackPattern`) está diseñada para soportar fases de jefe en iteraciones futuras sin modificar esta estructura.
- **AttackPattern**: Secuencia de ataque de un jefe. Atributos: `id`, `telegraphDurationMs: number` (≥ 1000), `damageZones: Zone[]`, `damage: number`, `hpThreshold?: number` (0–100, porcentaje de HP del jefe por debajo del cual el patrón se vuelve elegible; **reservado para uso futuro**; si ausente o `undefined`, el patrón está siempre activo). En esta fase inicial, ningún patrón usa `hpThreshold`; el motor los trata todos como activos.
- **DeckArchetype**: Plantilla de mazo inicial seleccionable por el jugador al comenzar una partida. Atributos: `id: 'action' | 'balanced' | 'exploration'`, `name: string`, `description: string`, `startingCards: Card[]`. Los tres arquetipos disponibles son: `action` (3 Acción), `balanced` (1 Acción + 1 Pasiva + 1 Utilidad), `exploration` (1 Acción + 1 Pasiva + 2 Utilidad).
- **GameRun**: Estado completo de una partida en curso. Atributos: `player: Player`, `currentPhase: 'exploration' | 'combat'`, `chosenArchetype: DeckArchetype`, `regularIslandsCompleted: number`, `bossIslandsDefeated: Island[]`, `currentIsland?: Island`, `pendingDebuffs: Debuff[]`, `isCompleted: boolean`, `isVictory: boolean`.
- **Debuff**: Penalización temporal de mar. Atributos: `type: 'damage' | 'speed' | 'hp'`, `magnitude: number`, `expireAfterCombat: boolean`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El motor de combate mantiene 60 FPS de forma sostenida durante toda la duración de un encuentro con jefe en hardware de gama media (CPU 4 núcleos, GPU integrada).
- **SC-002**: Los patrones de ataque de los jefes se telegrafían con un mínimo de 1 segundo de anticipación visual antes del impacto, medible en los datos de cada `AttackPattern`.
- **SC-003**: Los porcentajes de probabilidad mostrados en las tarjetas de decisión coinciden exactamente con los pesos definidos en el modelo de datos del evento (0% de discrepancia).
- **SC-004**: Un jugador nuevo puede completar un ciclo completo de exploración → combate → recompensa sin consultar documentación externa, verificable mediante prueba de usuario con 5 participantes nuevos.
- **SC-005**: El 100% de los módulos de lógica de juego (engine/) tienen cobertura de tests unitarios en sus flujos principales, confirmado por el reporte de Vitest.
- **SC-006**: El pipeline CI/CD completa lint + tests en menos de 5 minutos por push, medido en el historial de GitHub Actions.
- **SC-007**: La duración de una partida completa (inicio a Fathom's End) es de entre 20 y 60 minutos para un jugador familiarizado, validable en sesiones de playtest.
- **SC-008**: La imagen Docker se construye y el servidor inicia en menos de 2 minutos en un entorno limpio.
- **SC-009**: El módulo de tienda rechaza cualquier compra con fondos < 15 monedas y el jugador no puede comprar ningún ítem con el oro inicial (0), verificable con tests unitarios.

---

## Assumptions

- El juego es **single-player exclusivamente**; no se contempla multijugador en ninguna fase del proyecto.
- La plataforma objetivo es **navegador web de escritorio moderno** (Chrome 90+, Firefox 88+, Safari 14+); el soporte móvil está fuera del alcance de esta especificación.
- El modelo de progresión es **roguelike por partida**: no hay persistencia entre partidas; al morir o ganar, el estado se resetea completamente.
- El banco de islas prediseñadas debe contener un mínimo viable para esta versión inicial: al menos **6 islas regulares** (para que las 3 presentadas al jugador sean aleatorias), **3 islas de jefe** (se presentan las 3, el jugador elige 1), **1 isla final**. El pool de cartas está fijado en exactamente 9 cartas únicas (3 Acción + 3 Pasiva + 3 Utilidad), todas especificadas explícitamente para esta entrega. La estructura de partida es: 3 regulares → 1 jefe → final.
- El **audio y efectos de sonido** están fuera del alcance de esta especificación core; se pueden agregar en una iteración posterior sin cambiar la arquitectura.
- Las **animaciones de personaje y jefes** (spritesheet) son responsabilidad del pipeline de assets; el motor asume que los assets existen en `/src/assets` en el formato correcto para PixiJS.
- El jugador **elige** al inicio de cada partida entre tres arquetipos de mazo fijos ("Acción", "Equilibrado", "Exploración"). La composición de cada arquetipo es fija y predefinida en el sistema; no hay personalización libre de cartas en el arranque.
- Los resultados de decisiones con **resultados anidados** se resuelven en el momento en que el segundo evento se dispara, no al momento de la decisión original (lazy resolution).
- Las **tiendas** se modelan como un tipo de evento de isla regular, no como una pantalla separada.
- Los **cooldowns** de cartas de Acción se miden en segundos de tiempo real de combate, no en turnos.
- La **generación de mapa** no usa grafos ni pathfinding; es una lista lineal de nodos con bifurcaciones en los puntos de selección.
- La **economía del juego** está diseñada para crear tensión progresiva: el jugador parte con 0 monedas y el ítem más barato cuesta 15, forzando completar al menos 2 eventos/combates antes de la primera compra. La curva de loot crece con la dificultad (5–15 eventos regulares → 30–60 jefes principales).

---

## Clarifications

### Session 2026-05-04

- Q: ¿Cuáles son los stats base del jugador y cómo aplican los modificadores de las cartas Pasivas? → A: HP=100, damage=10, speed=200 px/s (fijos). Las Pasivas aplican TANTO multiplicadores (×1.5 daño) COMO bonos planos (+20 HP). Fórmula: `daño_final = (base_damage + flat_bonus) × multiplicador`.
- Q: ¿Con qué probabilidad se disparan los eventos de mar y cómo cambia esa probabilidad durante la partida? → A: Probabilidad escalonada progresiva: ~10% en las primeras islas, aumentando gradualmente hasta ~40–50% cerca del final. Los eventos de mar son mayormente penalizadores, por eso la probabilidad es baja al inicio (jugador débil) y sube a medida que el jugador se vuelve más poderoso.
- Q: ¿Los jefes tienen fases de combate diferenciadas (cambios de comportamiento según % de HP)? → A: Sin fases de jefe en esta fase inicial (Opción A). El modelo `Boss` usa `AttackPattern[]` sin phase-gating activo; cada `AttackPattern` incluye el campo opcional `hpThreshold?: number` reservado para uso futuro, permitiendo dividir patrones por umbral de HP en iteraciones posteriores sin romper la estructura existente.
- Q: ¿El jugador puede elegir su mazo inicial o siempre arranca con el mismo conjunto de cartas? → A: El jugador elige entre 3 arquetipos fijos al inicio de cada partida: "Acción" (3 Acción), "Equilibrado" (1 Acción + 1 Pasiva + 1 Utilidad), "Exploración" (1 Acción + 1 Pasiva + 2 Utilidad). La composición de cada arquetipo es fija; no hay libre personalización en el arranque.
- Q: ¿Cuál es la economía base de la tienda y el ritmo de loot esperado? → A: Oro inicial 0. Primer combate ~8 monedas. La tienda obliga a completar 2+ combates/eventos antes de la primera compra (mínimo 15 monedas). Categorías en esta entrega: **solo Cartas** (Armas/Armaduras fuera de alcance). Rangos de loot: eventos regulares 5–15, combates menores 8–20, jefes principales 30–60. Precios tienda: Carta común 15–25, Carta rara 40–70.

### Session 2026-05-12

- Q: ¿Cuántas cartas únicas existirán en el pool total del juego? → A: 9 cartas únicas: exactamente 3 de Acción + 3 Pasivas + 3 Utilidad. Todas las cartas del juego están especificadas explícitamente para esta entrega.
- Q: ¿Cuánta vida (HP) tienen los jefes por categoría? → A: Jefe menor (isla regular): **900 HP** *(ajustado en diseño de B1 para pelea de resistencia; pendiente validación por playtesting)*. Jefe principal (isla de jefe): 400 HP *(pendiente de revisión al diseñar B2–B4)*. Jefe final (Fathom's End): 800 HP *(pendiente de revisión)*. La escala original 1×/2.6×/5.3× (150/400/800) fue descartada en favor de combates más largos e intensos.
- Q: ¿Cómo recupera HP el jugador fuera del combate? → A: No hay recuperación automática de HP. La única curación proviene de eventos de isla/mar o ítems de tienda. Se permite diseñar cartas de recuperación de vida (Pasiva, Acción o Utilidad) dentro del pool de 9 cartas definido.
- Q: ¿Cuántas cartas se ofrecen como recompensa al derrotar un jefe menor? → A: El jugador elige 1 de 2 cartas aleatorias del loot pool del jefe. Con solo 9 cartas en el pool total y una partida corta, 2 opciones son suficientes para generar decisión sin inflar el mazo ni agotar el pool rápidamente.
- Q: ¿Cuál es la estructura completa del mapa para esta versión inicial? → A: 3 islas regulares → 1 isla de jefe (elegida de 3 opciones, las otras 2 se descartan) → isla final Fathom's End. Duración estimada: 20–30 min. Estructura diseñada para ser la base expandible; aumentar el número de islas en versiones futuras no requiere cambios arquitecturales.
