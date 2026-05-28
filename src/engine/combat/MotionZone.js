/**
 * MotionZone — lógica pura para hitboxes con movimiento lineal (PixiJS-free).
 *
 * Usado por el patrón `bubble_cascade` del Capitán Cangrejo:
 * la zona de peligro se desplaza de izquierda a derecha (o viceversa)
 * durante el tiempo de telegraph, según `directionMode`.
 */

/**
 * @description Resuelve la dirección de desplazamiento para un patrón con `motion`.
 *              - "ltr"    → siempre izquierda a derecha
 *              - "rtl"    → siempre derecha a izquierda
 *              - "random" → usa `rng` para elegir al azar en cada invocación
 * @param {"ltr"|"rtl"|"random"} directionMode
 * @param {() => number} rng - función RNG que retorna [0, 1)
 * @returns {"ltr"|"rtl"}
 */
export function resolveDirection(directionMode, rng) {
    if (directionMode === 'ltr') return 'ltr'
    if (directionMode === 'rtl') return 'rtl'
    return rng() < 0.5 ? 'ltr' : 'rtl'
}

/**
 * @description Calcula la posición actual de una zona de peligro móvil.
 *              Interpola linealmente `x` entre `motion.fromX` y `motion.toX`
 *              (o al revés si direction es "rtl") según el progreso 0→1.
 *              `y`, `width` y `height` de la zona base no cambian.
 *
 * @param {{ x: number, y: number, width: number, height: number }} baseZone  - zona original del JSON
 * @param {{ fromX: number, toX: number, durationMs: number }}       motion   - descriptor de movimiento
 * @param {"ltr"|"rtl"}                                               direction - dirección resuelta
 * @param {number}                                                    progress  - fracción 0–1 del recorrido
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function computeMotionZone(baseZone, motion, direction, progress) {
    const startX = direction === 'ltr' ? motion.fromX : motion.toX
    const endX = direction === 'ltr' ? motion.toX : motion.fromX
    const x = startX + (endX - startX) * progress
    return { x, y: baseZone.y, width: baseZone.width, height: baseZone.height }
}
