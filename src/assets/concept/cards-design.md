# Diseño de Cartas — Fathom's End v1.0

**Fecha:** 2026-05-12  
**Estado:** Aprobado — listo para implementar en `cards.json`  
**Total:** 11 cartas únicas (5 Acción + 4 Pasiva + 3 Utilidad)

---

## Contexto del sistema

- **Stats base del jugador:** HP 100, daño 10, velocidad 200 px/s
- **Fórmula de daño:** `daño_final = (base_damage + flatDamage) × damageMult`
- **Arquetipos iniciales:**
  - `action` → Teletransporte + Golpe Potenciado + Escudo
  - `balanced` → Teletransporte + Armadura de Cuero + Llave Maestra
  - `exploration` → Teletransporte + Armadura de Cuero + Llave Maestra + Provisiones Extra

---

## Cartas de Acción

Las cartas de Acción se activan manualmente durante el combate. Ejecutan su efecto inmediatamente y entran en cooldown (segundos de tiempo real). No se consumen; se reutilizan en cada pelea.

---

### A1 — Teletransporte

| Campo | Valor |
|-------|-------|
| `id` | `card_action_teleport` |
| `name` | Teletransporte |
| `type` | `action` |
| `rarity` | `common` |
| `cost` | 20 |
| `cooldown` | 5s |

**Efecto:** Mueve instantáneamente al jugador **200 px** en la dirección de movimiento actual al momento de activar la carta. Si el jugador está quieto, no ocurre desplazamiento.

**Nota de implementación:** 200 px = 1 segundo de movimiento base. El jugador no puede teletransportarse fuera de los límites de la arena.

---

### A2 — Golpe Potenciado

| Campo | Valor |
|-------|-------|
| `id` | `card_action_heavy_strike` |
| `name` | Golpe Potenciado |
| `type` | `action` |
| `rarity` | `rare` |
| `cost` | 50 |
| `cooldown` | 9s |

**Efecto:** El próximo ataque del jugador aplica un multiplicador de daño `×3`. Después de conectar el ataque potenciado, el buff se consume y la carta entra en cooldown.

**Nota de implementación:** El buff persiste hasta que el jugador conecta un ataque; no tiene ventana de tiempo límite.

---

### A3 — Escudo

| Campo | Valor |
|-------|-------|
| `id` | `card_action_shield` |
| `name` | Escudo |
| `type` | `action` |
| `rarity` | `rare` |
| `cost` | 50 |
| `cooldown` | 7s |

**Efecto:** Activa un escudo que absorbe el siguiente golpe recibido, anulando completamente su daño. El escudo **expira automáticamente si el jugador no recibe daño en 1 segundo**, y la carta entra en cooldown igualmente.

**Nota de implementación:** Diseñado para usarse reactivamente justo antes de un ataque telegrafíado.

---

### A4 — Puño Salado

> Carta de acción común obtenida como drop exclusivo del **Capitán Cangrejo**. También puede aparecer en tienda en partidas posteriores.

| Campo | Valor |
|-------|-------|
| `id` | `card_action_salty_fist` |
| `name` | Puño Salado |
| `type` | `action` |
| `rarity` | `common` |
| `cost` | 20 |
| `cooldown` | 5s |

**Efecto:** Lanza un golpe a distancia que inflige **12 de daño directo** al jefe. No requiere acercarse al enemigo.

**Nota de diseño:** DPS intencional bajo (2.4/s) comparado con el ataque básico ilimitado (10 dmg). Su valor es el rango — útil cuando acercarse es peligroso durante telegraphs activos.

Las cartas Pasivas están activas automáticamente mientras estén en el mazo. Nunca se activan manualmente. Aplican sus modificadores a los stats del jugador desde el inicio del combate.

---

### P1 — Armadura de Cuero

| Campo | Valor |
|-------|-------|
| `id` | `card_passive_leather_armor` |
| `name` | Armadura de Cuero |
| `type` | `passive` |
| `rarity` | `common` |
| `cost` | 20 |

**Efecto:** `flatHp: +30` → HP máximo aumenta de 100 a 130.

---

### P2 — Espada Afilada

| Campo | Valor |
|-------|-------|
| `id` | `card_passive_sharp_sword` |
| `name` | Espada Afilada |
| `type` | `passive` |
| `rarity` | `common` |
| `cost` | 20 |

**Efecto:** `flatDamage: +10` → daño base aumenta de 10 a 20. Con fórmula completa: `(10 + 10) × 1 = 20` por ataque.

---

### P3 — Botas Veloces

| Campo | Valor |
|-------|-------|
| `id` | `card_passive_swift_boots` |
| `name` | Botas Veloces |
| `type` | `passive` |
| `rarity` | `common` |
| `cost` | 20 |

**Efecto:** `speedBonus: +80` → velocidad de movimiento aumenta de 200 a 280 px/s.

---

### P4 — Escudo de Concha

> Carta pasiva común disponible **solo en tienda**. No dropea ningún jefe.

| Campo | Valor |
|-------|-------|
| `id` | `card_passive_shell_shield` |
| `name` | Escudo de Concha |
| `type` | `passive` |
| `rarity` | `common` |
| `cost` | 15 |

**Efecto:** `flatHp: +15` → HP máximo aumenta de 100 a 115. Apilable con Armadura de Cuero (+30) para llegar a 145 HP total.

---

## Cartas de Utilidad

Las cartas de Utilidad son consumibles de exploración. Se usan en eventos de isla o de mar. Al usarse, desaparecen permanentemente del mazo. Nunca se usan en combate.

Hacen una de dos cosas:
1. **Desbloquean** una opción de decisión que aparece bloqueada sin la carta.
2. **Evitan** un peligro en eventos negativos, garantizando el resultado favorable.

---

### U1 — Llave Maestra

| Campo | Valor |
|-------|-------|
| `id` | `card_utility_master_key` |
| `name` | Llave Maestra |
| `type` | `utility` |
| `rarity` | `common` |
| `cost` | 15 |

**Uso en evento:** Desbloquea opciones de decisión que requieran abrir cofres, puertas o accesos cerrados. Sin la carta, esas opciones aparecen bloqueadas con el texto "Requiere: Llave Maestra".

**Ejemplo de evento:** *"Encuentras un cofre con candado. [Abrirlo con llave — Requiere: Llave Maestra] / [Ignorarlo]"*

---

### U2 — Provisiones Extra

| Campo | Valor |
|-------|-------|
| `id` | `card_utility_provisions` |
| `name` | Provisiones Extra |
| `type` | `utility` |
| `rarity` | `common` |
| `cost` | 15 |

**Uso en evento:** Evita eventos negativos de escasez (hambre, tormenta, naufragio). Al usarla, el resultado negativo se cancela y se obtiene el resultado neutral/positivo garantizado.

**Ejemplo de evento:** *"Una tormenta amenaza el barco. [Usar Provisiones Extra — sobrevivir sin daño] / [Capear la tormenta — 50% pierde HP / 50% OK]"*

---

### U3 — Carta de Navegación

| Campo | Valor |
|-------|-------|
| `id` | `card_utility_navigation_chart` |
| `name` | Carta de Navegación |
| `type` | `utility` |
| `rarity` | `common` |
| `cost` | 15 |

**Uso en evento:** Garantiza el resultado de loot máximo en un evento de exploración, saltándose el RNG. Al usarla en una decisión con múltiples resultados ponderados, siempre se obtiene el de mayor recompensa.

**Ejemplo de evento:** *"Unas ruinas misteriosas. [Usar Carta de Navegación — loot garantizado máximo] / [Entrar sin mapa — 50% loot / 50% trampa]"*

---

## Resumen completo

| ID | Nombre | Tipo | Rareza | Costo | Efecto clave |
|----|--------|------|--------|-------|-------------|
| `card_action_teleport` | Teletransporte | action | common | 20 | Mueve 200px en dirección actual, CD 5s |
| `card_action_heavy_strike` | Golpe Potenciado | action | rare | 50 | ×3 daño próximo ataque, CD 9s |
| `card_action_shield` | Escudo | action | rare | 50 | Absorbe 1 golpe (expira en 1s), CD 7s |
| `card_passive_leather_armor` | Armadura de Cuero | passive | common | 20 | +30 HP máximo |
| `card_passive_sharp_sword` | Espada Afilada | passive | common | 20 | +10 daño plano |
| `card_passive_swift_boots` | Botas Veloces | passive | common | 20 | +80 px/s velocidad |
| `card_utility_master_key` | Llave Maestra | utility | common | 15 | Desbloquea opciones con cerradura |
| `card_utility_provisions` | Provisiones Extra | utility | common | 15 | Evita eventos negativos de escasez |
| `card_utility_navigation_chart` | Carta de Navegación | utility | common | 15 | Garantiza loot máximo en exploración |
| `card_action_salty_fist` | Puño Salado | action | common | 20 | 12 dmg a distancia, CD 5s — drop Capitán Cangrejo |
| `card_passive_shell_shield` | Escudo de Concha | passive | common | 15 | +15 HP máximo — solo tienda |
