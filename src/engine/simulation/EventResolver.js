/**
 * EventResolver — weighted outcome selection for narrative events.
 *
 * The resolver treats each outcome as a weight slice in a 0..100 range and
 * returns the first outcome whose cumulative weight exceeds the random roll.
 * If floating-point precision prevents a match, the last outcome is returned
 * as a safe fallback.
 */

/**
 * Selects one outcome from a weighted list.
 *
 * @param {Array<{ weight: number } & object>} outcomes
 * @param {() => number} [rng=Math.random]
 * @returns {{ weight: number } & object}
 */
export function resolveOutcome(outcomes, rng = Math.random) {
  if (!Array.isArray(outcomes) || outcomes.length === 0) {
    return undefined
  }

  const roll = rng() * 100
  let accumulated = 0

  for (const outcome of outcomes) {
    accumulated += outcome.weight

    if (roll < accumulated) {
      return outcome
    }
  }

  return outcomes[outcomes.length - 1]
}