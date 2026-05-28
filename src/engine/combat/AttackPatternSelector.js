/**
 * AttackPatternSelector — pure JS engine module, no Vue/PixiJS imports.
 *
 * Selects which boss attack patterns are active based on the boss's current HP
 * ratio, and randomly picks one from the eligible set using an injected rng.
 *
 * hpThreshold (if present) means the pattern only activates when
 * bossHp / bossMaxHp <= hpThreshold. Patterns without hpThreshold are always eligible.
 */

/**
 * @typedef {Object} AttackPattern
 * @property {string} id                  - Unique pattern identifier
 * @property {number} telegraphDurationMs - Milliseconds of telegraph before the hit (≥ 1000)
 * @property {number} [hpThreshold]       - Fraction of max HP below which the pattern unlocks (0–1)
 */

/**
 * @description Filters an array of attack patterns to those currently usable
 *              by the boss given its current HP ratio.
 *              A pattern is eligible when:
 *              - It has no `hpThreshold` property, OR
 *              - `bossHp / bossMaxHp <= hpThreshold`
 * @param {AttackPattern[]} patterns   - All patterns defined for the boss
 * @param {number}          bossHp    - Current boss HP (≥ 0)
 * @param {number}          bossMaxHp - Boss maximum HP (> 0)
 * @returns {AttackPattern[]} Array of eligible patterns (may be empty)
 */
export function getEligiblePatterns(patterns, bossHp, bossMaxHp) {
  const hpRatio = bossHp / bossMaxHp
  return patterns.filter((p) => {
    if (p.hpThreshold === undefined) return true
    return hpRatio <= p.hpThreshold
  })
}

/**
 * @description Randomly selects one pattern from the eligible list using the
 *              injected `rng` function (allows deterministic tests).
 *              - If patterns carry a numeric `weight` field → weighted selection.
 *              - If no pattern has `weight` → uniform selection (backwards-compatible).
 * @param {AttackPattern[]} eligible - Non-empty array of eligible attack patterns
 * @param {() => number}    rng      - Random number generator returning [0, 1)
 * @returns {AttackPattern} The selected attack pattern
 * @throws {Error} If `eligible` is empty — caller must ensure at least one pattern exists
 */
export function pickPattern(eligible, rng) {
  if (eligible.length === 0) {
    throw new Error('No eligible patterns available for the boss at current HP')
  }

  // Weighted selection when at least one pattern carries a `weight` field
  const hasWeights = eligible.some((p) => typeof p.weight === 'number')
  if (hasWeights) {
    const totalWeight = eligible.reduce((sum, p) => sum + (p.weight ?? 1), 0)
    let roll = rng() * totalWeight
    for (const pattern of eligible) {
      roll -= pattern.weight ?? 1
      if (roll < 0) return pattern
    }
    // Floating-point safety net — return last pattern
    return eligible[eligible.length - 1]
  }

  // Uniform selection (original behaviour)
  const index = Math.floor(rng() * eligible.length)
  return eligible[index]
}
