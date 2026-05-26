# Diseño de Jefes — Fathom's End v1.0

**Fecha:** 2026-05-25  
**Estado:** En diseño — valores sujetos a ajuste tras playtesting  
**Total planificado:** 1 jefe menor + 3 jefes principales + 1 jefe final (Fathom's End)  
**Implementado actualmente en `bosses.json`:** Capitán Cangrejo (jefe menor)

---

## Clarificaciones

### Sesión 2026-05-26

- Q: ¿Telegraph de Zarpazo Izquierdo/Derecho: cumplir mínimo 1000ms, bajar a 700ms o crear categoría fastAttack? → A: 700 ms (excepción explícita para ataques de posicionamiento)
- Q: ¿Cascada de Burbujas: hitbox móvil via campo `motion` en motor (A) o zonas estáticas en secuencia (B)? → A: Opción A — agregar `motion: { fromX, toX, durationMs }` al motor
- Q: ¿Golpe de Suelo: zonas de roca generadas en runtime (A), 8 candidatas pre-definidas activar 4 al azar (B), o 4 fijas siempre (C)? → A: Opción B — pre-definir 8 posiciones en `bosses.json`, activar 4 al azar
- Q: ¿Rotación de ataques: fija (A), aleatoria con pesos (B), aleatoria pura (C), o adaptativa (D)? → A: Opción B — aleatoria con pesos definidos en `bosses.json` (data-driven, reutilizable para todos los jefes futuros)
- Q: ¿Cooldown entre ataques: fijo 1500ms (A), variable 800-1800ms (B), sin pausa (C), o cooldown por patrón (D)? → A: Opción B con rango personalizado — `attackCooldown: { min: 300, max: 2000 }` para máxima incertidumbre
- Q: ¿Segunda fase del Capitán Cangrejo: implementar ahora (A), no en v1 pero JSON preparado (B), o cambiar concepto (C)? → A: No en v1 — sin segunda fase por ahora
- Q: ¿Balance de Puño Salado: mantener 5s/12dmg (A), bajar cooldown (B), subir daño (C), o cambiar efecto (D)? → A: Mantener 5s/12dmg — carta común con DPS bajo pero valor en rango, sirve como básico extra
- Q: ¿Escudo de Concha: precio en tienda 25 (A), 15 (B), 30 (C)? → A: 15 oro — y solo disponible en tienda, no dropea el jefe
- Q: ¿Puño Salado: precio en tienda 20 (A), 15 (B), 25 (C)? → A: 20 oro — consistente con Teletransporte (acción común)

---

## Contexto del sistema de combate

- **Arena:** 960 × 540 px (canvas PixiJS)
- **HP base del jugador:** 100 (puede aumentar con cartas Pasivas, ej. +30 con Armadura de Cuero)
- **Daño base del jugador:** 10 por ataque básico (clic derecho)
- **Fórmula de daño al jugador:** directo, sin modificadores salvo débuffs activos
- **Telegraph:** tiempo de advertencia visual antes de que el ataque conecte (mínimo 1000 ms según spec)
- **Zonas de peligro:** rectángulos `{ x, y, width, height }` sobre el canvas, coordenadas absolutas
- **`isMajor: false`** → jefe menor, aparece en islas regulares de boss, da loot común
- **`isMajor: true`** → jefe principal, aparece en gate de boss (tras 5 islas), da carta única

---

## Principios de diseño

1. **Cada ataque debe ser esquivable** con el tiempo de telegraph dado y velocidad base (200 px/s).
2. **Los ataques de mayor daño tienen mayor telegraph** — dar tiempo proporcional al riesgo.
3. **Los patrones cambian al bajar de HP** usando `hpThreshold` para segunda fase.
4. **El loot pool refleja la temática del jefe** — un cangrejo da cartas de armadura/golpe físico.
5. **La carta única de jefe principal** (`uniqueCard`) solo se obtiene derrotándolo; no aparece en tienda.

---

## Jefes Menores (`isMajor: false`)

Los jefes menores aparecen en islas regulares de tipo boss. Son más simples, sin carta única ni segunda fase. Sirven como preparación antes del gate de jefes principales.

---

### B1 — Capitán Cangrejo *(implementado)*

> Jefe introductorio. Enseña al jugador los tres arquetipos de ataque: zona frontal, multi-zona dispersa, zona amplia lenta.

| Campo | Valor |
|-------|-------|
| `id` | `crab_captain` |
| `name` | Capitán Cangrejo |
| `isMajor` | `false` |
| `hp / maxHp` | 900 / 900 |
| `spriteKey` | `boss_crab_captain` |

#### Análisis de HP

Con daño base 10 por ataque y sin cartas pasivas, el jugador necesita **90 ataques** para derrotarlo. Con Espada Afilada (+10 flatDamage) = 20 por ataque → **45 ataques**. Con Golpe Potenciado (×3) en un ataque = 30 dmg → acelera la pelea significativamente.

HP alto intencionalmente: el combate es de resistencia, no de burst. La pelea debe sentirse como una batalla real, no un encuentro rápido.

> **Nota de balance post-playtesting:** si la pelea se siente demasiado larga, bajar a 600. Si demasiado corta, subir a 1200. 900 es el punto de partida.

#### Cooldown entre ataques

**Sistema: pausa variable data-driven** — campo `attackCooldown: { min: 300, max: 2000 }` en `bosses.json`. El motor elige un valor aleatorio uniforme entre `min` y `max` ms tras cada ataque antes de iniciar el siguiente. La alta varianza (300–2000 ms) genera incertidumbre: el jugador no puede predecir el ritmo del cangrejo.

> **Nota de diseño:** con un mínimo de 300 ms el cangrejo puede encadenar ataques casi inmediatamente — esto es intencional para momentos de presión. El máximo de 2000 ms da respiros naturales. Jefes futuros definen su propio rango en su JSON.

#### Rotación de ataques

**Sistema: aleatorio con pesos data-driven** — el `AttackPatternSelector` lee el campo `weight` de cada patrón en `bosses.json` y hace una selección ponderada. Ninguna lógica de pesos está hardcodeada en el motor; cada jefe define los suyos propios.

| Patrón | `weight` | Probabilidad efectiva |
|---------|----------|----------------------|
| `claw_swipe_left` | 40 | ~40% |
| `claw_swipe_right` | 40 | ~40% |
| `bubble_cascade` | 15 | ~15% |
| `ground_slam` | 5 | ~5% |

> **Nota de implementación:** agregar campo `"weight": <int>` a cada entrada de `attackPatterns` en `bosses.json`. El `AttackPatternSelector.js` debe leer estos pesos en lugar de cualquier lógica fija actual. Jefes futuros solo necesitan definir sus propios pesos en sus datos JSON, sin tocar el motor.

---

#### Patrones de ataque

El cangrejo tiene **4 patrones**: dos zarpazos (uno por pinza), una cascada y un golpe de suelo. Los dos zarpazos son rápidos y de bajo daño — castigan quedarse en un lado. La cascada y el golpe de suelo son los ataques principales.

---

##### Zarpazo Izquierdo

| Campo | Valor |
|-------|-------|
| `id` | `claw_swipe_left` |
| `damage` | 10 |
| `telegraphDurationMs` | 700 |
| `hpThreshold` | — (siempre activo) |

**Zona:** lado izquierdo con solapamiento central → rectángulo (0, 200, 530, 200). Cubre de x=0 a x=530, invadiendo 50 px el centro.

**Animación sugerida:** la pinza izquierda del cangrejo se levanta y baja de golpe hacia su lado.

**Lectura para el jugador:** "pinza izquierda sube → muévete a la derecha del centro".

**Escapabilidad:** el borde seguro empieza en x=530. Desde x=100 el jugador necesita recorrer 430 px en 800 ms (a 200 px/s recorre 160 px) — no alcanza si está muy lejos. Por eso el daño es bajo (10): castigador de posición, no letal. El jugador aprende a mantenerse cerca del centro.

---

##### Zarpazo Derecho

| Campo | Valor |
|-------|-------|
| `id` | `claw_swipe_right` |
| `damage` | 10 |
| `telegraphDurationMs` | 700 |
| `hpThreshold` | — (siempre activo) |

**Zona:** lado derecho con solapamiento central → rectángulo (430, 200, 530, 200). Cubre de x=430 a x=960, invadiendo 50 px el centro.

**Zona de solapamiento (ambos zarpazos):** x=430 a x=530 (100 px centrales) es peligrosa para ambas pinzas. El jugador no puede simplemente quedarse en el centro — debe leer qué pinza viene.

**Animación sugerida:** pinza derecha baja hacia su lado.

**Lectura para el jugador:** "pinza derecha sube → muévete a la izquierda".

**Nota de diseño:** los dos zarpazos son intercambiables en la rotación de patrones — el cangrejo puede usar cualquiera de los dos independientemente. El jugador aprende a leer qué pinza se levanta, no a memorizar una secuencia fija.

---

##### Cascada de Burbujas

| Campo | Valor |
|-------|-------|
| `id` | `bubble_cascade` |
| `damage` | 12 |
| `telegraphDurationMs` | 1400 |
| `hpThreshold` | — (siempre activo) |

**Mecánica:** una hitbox cuadrada de ~150×300 px barre el terreno de izquierda a derecha (o derecha a izquierda, alternando). La hitbox viaja de un extremo al otro durante el `telegraphDurationMs`.

**Zona de inicio L→R:** (0, 150, 150, 300) → llega a (810, 150, 150, 300) al expirar el telegraph.  
**Zona de inicio R→L:** (810, 150, 150, 300) → llega a (0, 150, 150, 300) al expirar el telegraph.

**Dirección:** aleatoria en cada uso — el jugador no puede anticipar el lado por memoria.

**Lectura para el jugador:** "burbuja gigante aparece en un extremo → mira de qué lado viene y corre en sentido contrario".

**Nota de implementación:** ✅ **Decisión tomada (2026-05-26):** usar campo `motion: { fromX, toX, durationMs }` en el patrón — el `CombatEngine` interpola la posición de la zona linealmente durante el telegraph. Requiere actualizar el motor para soportar zonas móviles.

**Campo adicional propuesto en `bosses.json`:** `"directionMode": "random"` (valores posibles: `"ltr"`, `"rtl"`, `"random"`).

**Velocidad de barrido:** 960 px en 1400 ms → ~685 px/s. El jugador a 200 px/s no puede outrunear la burbuja — debe anticipar leyendo de qué lado aparece.

---

##### Golpe de Suelo

| Campo | Valor |
|-------|-------|
| `id` | `ground_slam` |
| `damage` | 20 (impacto inicial) + 15 (caída de roca, por zona) |
| `telegraphDurationMs` | 2200 |
| `hpThreshold` | — (siempre activo) |

**Mecánica en dos fases dentro del mismo ataque:**

1. **Impacto de suelo** (ms 0–2200): el cangrejo golpea el suelo con ambas pinzas simultáneamente. Hitbox grande en la zona central-baja → rectángulo (160, 300, 640, 180). El jugador debe estar en los extremos o en la parte alta de la arena.

2. **Lluvia de rocas** (ms ~1200–2200 post-impacto, superpuesto): el golpe lanza rocas al aire que caen en 3–4 puntos aleatorios de la arena. Cada punto de caída se telegrafía con un círculo en el suelo durante ~1000 ms antes de que la roca aterrice. Daño de roca: 15 por zona, zona de ~100×100 px.

**Sprite:** usa el sprite de ataque de suelo disponible para la animación de ambas pinzas golpeando.

**Lectura para el jugador:** "el cangrejo se agacha y levanta ambas pinzas → corre a los bordes; luego mira los círculos en el suelo y aléjate de ellos".

**Escapabilidad del impacto:** zona de 640 px de ancho deja 160 px libres en cada lado → el jugador a 200 px/s con 2200 ms recorre 440 px, suficiente para llegar a un borde seguro.

**Escapabilidad de rocas:** 1000 ms de telegraph por círculo → a 200 px/s el jugador recorre 200 px, suficiente para salir de una zona de 100 px.

**Cantidad de rocas:** 4, posiciones completamente aleatorias dentro del área de la arena.

**Nota de implementación:** ✅ **Decisión tomada (2026-05-26):** pre-definir **8 posiciones candidatas** en `bosses.json` bajo el campo `"rockZoneCandidates"`. En cada uso del ataque, el motor elige 4 al azar de esas 8 y las activa como zonas de telegraph. No requiere cambios estructurales al motor (las zonas siguen siendo estáticas; la selección aleatoria ocurre al iniciar el ataque).

**Posiciones candidatas propuestas** (distribuidas para cubrir todo el arena, evitando esquinas exactas):

| # | x | y | Zona |
|---|---|---|------|
| 1 | 100 | 150 | izquierda alta |
| 2 | 300 | 420 | centro-izquierda baja |
| 3 | 500 | 160 | centro alta |
| 4 | 700 | 400 | centro-derecha baja |
| 5 | 180 | 350 | izquierda media |
| 6 | 600 | 300 | derecha media |
| 7 | 400 | 200 | centro media |
| 8 | 820 | 160 | derecha alta |

> Todas las zonas son 100×100 px. Posiciones sujetas a ajuste tras ver el layout visual del combate.

---

#### Loot Pool

| Carta | Tipo | Rareza | Efecto | Fuente |
|-------|------|--------|--------|--------|
| Puño Salado | `action` | `common` | Ataque directo de 12 dmg, cooldown 5s | Drop exclusivo del Capitán Cangrejo |
| Escudo de Concha | `passive` | `common` | +15 HP máximo | **Solo tienda** — no dropea el jefe |

> **Decisión (2026-05-26):** mantener `cooldown: 5s` y `damage: 12`. Carta común intencional — no compite en DPS con el ataque básico (2.4/s vs 10 dmg ilimitado), su valor es el rango a distancia y servir como DPS extra en momentos donde acercarse es peligroso. Si tras playtesting parece irrelevante, bajar a 3s.

---

#### Segunda Fase

> **Decisión (2026-05-26):** sin segunda fase en v1. El campo `hpThreshold` queda disponible en el motor para implementarla en el futuro sin cambios estructurales.
>
> **Idea reservada:** al llegar al 30% de HP, el cangrejo pierde una pinza → los zarpazos solo vienen de un lado, la cascada y el golpe de suelo con ~20% menos `telegraphDurationMs`. No implementar hasta que el balance base esté validado.

---

## Jefes Principales (`isMajor: true`)

Los jefes principales aparecen tras completar 5 islas regulares (boss gate). Tienen segunda fase (hpThreshold), carta única y mayor HP. Se necesitan 3 victorias contra jefes principales para desbloquear Fathom's End.

> **PENDIENTE DE DISEÑO:** Los 3 jefes principales aún no están diseñados ni en `bosses.json`. Las secciones siguientes son plantillas a completar.

---

### B2 — [NOMBRE PENDIENTE] Jefe Principal 1

> **Concepto temático:** <!-- Definir: ¿qué criatura marina? ¿qué mecánica central? -->  
> **Dificultad relativa:** Media — primer jefe principal que enfrenta el jugador.

| Campo | Valor |
|-------|-------|
| `id` | <!-- ej: `kraken_lieutenant` --> |
| `name` | <!-- Nombre en español --> |
| `isMajor` | `true` |
| `hp / maxHp` | <!-- Sugerido: 200–250 --> |
| `spriteKey` | <!-- pendiente de asset --> |
| `uniqueCard` | <!-- id de la carta única --> |

#### Patrones — Fase 1 (HP > 50%)

<!-- Definir 2–3 ataques. Recordar: telegraph ≥ 1000 ms, damage proporcional al telegraph -->

| Ataque | Daño | Telegraph | Zona aproximada |
|--------|------|-----------|-----------------|
| <!-- nombre --> | <!-- dmg --> | <!-- ms --> | <!-- descripción --> |
| <!-- nombre --> | <!-- dmg --> | <!-- ms --> | <!-- descripción --> |

#### Patrones — Fase 2 (HP ≤ 50%, `hpThreshold: 0.5`)

<!-- Definir qué cambia: ¿más velocidad? ¿nuevo ataque? ¿ataques anteriores con más daño? -->

| Ataque | Daño | Telegraph | Cambio respecto a fase 1 |
|--------|------|-----------|--------------------------|
| <!-- nombre --> | <!-- dmg --> | <!-- ms --> | <!-- qué es nuevo --> |

#### Carta Única

| Campo | Valor |
|-------|-------|
| `id` | <!-- ej: `card_unique_kraken_grip` --> |
| `name` | <!-- Nombre en español --> |
| `type` | <!-- `action` o `passive` --> |
| `rarity` | `legendary` |
| `effect` | <!-- Definir: ¿qué hace que no pueden hacer las cartas normales? --> |

> **Nota de diseño:** La carta única debe sentirse poderosa e irrepetible. No debe ser simplemente "más daño" — debe cambiar cómo el jugador juega. Ejemplos: invocar una zona de daño pasiva, reducir todos los cooldowns, reflejar daño.

---

### B3 — [NOMBRE PENDIENTE] Jefe Principal 2

> **Concepto temático:** <!-- Definir -->  
> **Dificultad relativa:** Media-Alta — segundo jefe principal.

| Campo | Valor |
|-------|-------|
| `id` | <!-- pendiente --> |
| `name` | <!-- pendiente --> |
| `isMajor` | `true` |
| `hp / maxHp` | <!-- Sugerido: 250–300 --> |
| `uniqueCard` | <!-- pendiente --> |

#### Patrones — Fase 1

| Ataque | Daño | Telegraph | Zona aproximada |
|--------|------|-----------|-----------------|
| <!-- --> | <!-- --> | <!-- --> | <!-- --> |

#### Patrones — Fase 2 (`hpThreshold: 0.4`)

| Ataque | Daño | Telegraph | Cambio |
|--------|------|-----------|--------|
| <!-- --> | <!-- --> | <!-- --> | <!-- --> |

#### Carta Única

| Campo | Valor |
|-------|-------|
| `id` | <!-- pendiente --> |
| `name` | <!-- pendiente --> |
| `effect` | <!-- pendiente --> |

---

### B4 — [NOMBRE PENDIENTE] Jefe Principal 3

> **Concepto temático:** <!-- Definir -->  
> **Dificultad relativa:** Alta — antesala de Fathom's End.

| Campo | Valor |
|-------|-------|
| `id` | <!-- pendiente --> |
| `name` | <!-- pendiente --> |
| `isMajor` | `true` |
| `hp / maxHp` | <!-- Sugerido: 300–350 --> |
| `uniqueCard` | <!-- pendiente --> |

#### Patrones — Fase 1

| Ataque | Daño | Telegraph | Zona aproximada |
|--------|------|-----------|-----------------|
| <!-- --> | <!-- --> | <!-- --> | <!-- --> |

#### Patrones — Fase 2 (`hpThreshold: 0.35`)

| Ataque | Daño | Telegraph | Cambio |
|--------|------|-----------|--------|
| <!-- --> | <!-- --> | <!-- --> | <!-- --> |

#### Carta Única

| Campo | Valor |
|-------|-------|
| `id` | <!-- pendiente --> |
| `name` | <!-- pendiente --> |
| `effect` | <!-- pendiente --> |

---

## Jefe Final — Fathom's End

> El jefe final no es una criatura — es la isla misma. O lo que vive en ella.  
> **Concepto:** <!-- Definir: ¿entidad cósmica? ¿personificación del mar? ¿fantasma del capitán? -->  
> **Mecánica especial:** <!-- Definir algo único que no tengan los otros jefes -->

| Campo | Valor |
|-------|-------|
| `id` | `fathoms_end_final` |
| `name` | <!-- Nombre definitivo --> |
| `isMajor` | `true` |
| `hp / maxHp` | <!-- Sugerido: 400–500 --> |
| `uniqueCard` | <!-- La carta más poderosa del juego --> |

#### Patrones — Fase 1

| Ataque | Daño | Telegraph | Zona |
|--------|------|-----------|------|
| <!-- --> | <!-- --> | <!-- --> | <!-- --> |

#### Patrones — Fase 2 (`hpThreshold: 0.5`)

| Ataque | Daño | Telegraph | Cambio |
|--------|------|-----------|--------|
| <!-- --> | <!-- --> | <!-- --> | <!-- --> |

#### Patrones — Fase 3 (`hpThreshold: 0.25`)

<!-- Los mejores jefes finales tienen 3 fases. Opcional pero recomendado. -->

| Ataque | Daño | Telegraph | Cambio |
|--------|------|-----------|--------|
| <!-- --> | <!-- --> | <!-- --> | <!-- --> |

#### Carta Única Final

> Esta carta debe ser el poder más fuerte del juego. El jugador la recibe aunque pierda contra Fathom's End? ← **Decisión pendiente**.

| Campo | Valor |
|-------|-------|
| `id` | <!-- ej: `card_unique_abyssal_power` --> |
| `name` | <!-- pendiente --> |
| `rarity` | `legendary` |
| `effect` | <!-- pendiente --> |

---

## Checklist de diseño por jefe

Antes de implementar cada jefe en `bosses.json`, verificar:

- [ ] HP calculado: ¿cuántos ataques básicos necesita el jugador? ¿Es justo?
- [ ] Cada ataque es esquivable a 200 px/s en el telegraph definido
- [ ] Los ataques más dañinos tienen más telegraph (proporcionalidad)
- [ ] Hay al menos 1 "espacio seguro" legible por ataque
- [ ] La segunda fase introduce un cambio real de comportamiento (no solo más daño)
- [ ] El loot pool temáticamente coherente con el jefe
- [ ] La carta única hace algo que ninguna carta comprable puede hacer

---

*Diseño: Matías + Oskar — Fathom's End Semana 4*
