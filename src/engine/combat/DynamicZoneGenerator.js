/**
 * DynamicZoneGenerator — lógica pura para zonas de roca del ground_slam (PixiJS-free).
 *
 * Genera `count` zonas de peligro cuadradas de tamaño `zoneSize`:
 * - modo "candidates": selecciona posiciones al azar de un array predefinido (sin repetición)
 * - modo "random":     genera posiciones aleatorias dentro de los límites del canvas
 *
 * Todas las zonas generadas se garantizan dentro de [0, arenaW] × [0, arenaH].
 */

/**
 * @typedef {{ x: number, y: number, width: number, height: number }} Zone
 */

/**
 * @description Genera zonas de daño dinámicas para un ataque de área.
 *
 * @param {{ count: number, mode: "candidates"|"random", zoneSize: number, candidates?: {x:number,y:number}[] }} spec
 * @param {number}          arenaW - Ancho del canvas (px)
 * @param {number}          arenaH - Alto del canvas (px)
 * @param {() => number}    rng    - Función RNG que retorna [0, 1)
 * @returns {Zone[]}
 * @throws {Error} Si mode === "candidates" pero `spec.candidates` no existe o está vacío
 */
export function generateDynamicZones(spec, arenaW, arenaH, rng) {
    const { count, mode, zoneSize } = spec

    if (mode === 'candidates') {
        if (!spec.candidates || spec.candidates.length === 0) {
            throw new Error(
                'DynamicZoneGenerator: mode "candidates" requiere el campo "candidates" con al menos una entrada'
            )
        }
        // Copia para no mutar el array original; selección sin repetición
        const pool = [...spec.candidates]
        const zones = []
        for (let i = 0; i < count && pool.length > 0; i++) {
            const idx = Math.floor(rng() * pool.length)
            const candidate = pool.splice(idx, 1)[0]
            const x = Math.max(0, Math.min(arenaW - zoneSize, candidate.x))
            const y = Math.max(0, Math.min(arenaH - zoneSize, candidate.y))
            zones.push({ x, y, width: zoneSize, height: zoneSize })
        }
        return zones
    }

    // mode === "random"
    const zones = []
    for (let i = 0; i < count; i++) {
        const x = Math.floor(rng() * (arenaW - zoneSize))
        const y = Math.floor(rng() * (arenaH - zoneSize))
        zones.push({ x, y, width: zoneSize, height: zoneSize })
    }
    return zones
}
