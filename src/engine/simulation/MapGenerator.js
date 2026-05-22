/**
 * MapGenerator — island option selection for exploration flow.
 *
 * Rules covered here:
 *  - Always returns the requested number of options when the pool has enough
 *    candidates.
 *  - Never repeats the immediately previous island when an alternative exists.
 *  - Resamples with replacement once the available pool is exhausted.
 *  - Pure JS module: no Vue, Pinia, or PixiJS imports.
 */

/**
 * Picks one element from a non-empty pool using the provided RNG.
 *
 * @param {Array<object>} pool
 * @param {() => number} rng
 * @returns {object}
 */
function pickFromPool(pool, rng) {
  const index = Math.floor(rng() * pool.length)
  return pool[index]
}

/**
 * Generates a set of island options from a bank of islands.
 *
 * The function samples without replacement until the filtered pool is
 * exhausted, then it replenishes the pool and keeps sampling with replacement.
 * The immediately previous island is excluded whenever an alternative exists.
 *
 * @param {Array<{ id: string } & object>} bank
 * @param {number} count
 * @param {string|null|undefined} previousIslandId
 * @param {() => number} [rng=Math.random]
 * @returns {Array<{ id: string } & object>}
 */
export function generateIslandOptions(bank, count = 3, previousIslandId = null, rng = Math.random) {
  if (!Array.isArray(bank) || count <= 0) {
    return []
  }

  const filteredPool = bank.filter((island) => island?.id !== previousIslandId)

  if (filteredPool.length === 0) {
    return []
  }

  const options = []
  let available = [...filteredPool]

  while (options.length < count) {
    if (available.length === 0) {
      available = [...filteredPool]
    }

    const selected = pickFromPool(available, rng)
    options.push(selected)

    if (available.length > 1) {
      available = available.filter((island) => island !== selected)
    } else {
      available = []
    }
  }

  return options
}

/**
 * Marks an island as completed while keeping the rest of its data intact.
 *
 * @param {{ isCompleted?: boolean } & object} island
 * @returns {{ isCompleted: true } & object}
 */
export function applyIslandResult(island) {
  if (!island) {
    return island
  }

  return {
    ...island,
    isCompleted: true,
  }
}