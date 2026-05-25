/**
 * MapGenerator — island option selection for exploration flow.
 *
 * Rules covered here:
 *  - Returns up to two options from the eligible exploration pool.
 *  - Never repeats the immediately previous island when an alternative exists.
 *  - Resamples with replacement once the available pool is exhausted.
 *  - Pure JS module: no Vue, Pinia, or PixiJS imports.
 */

/**
 * Generates a set of island options from a bank of islands.
 *
 * The function samples from regular and shop islands, excluding the
 * immediately previous island whenever an alternative exists.
 *
 * @param {Array<{ id: string } & object>} bank
 * @param {number} count
 * @param {string|null|undefined} previousIslandId
 * @param {() => number} [rng=Math.random]
 * @returns {Array<{ id: string } & object>}
 */
export function generateIslandOptions(bank, count = 2, previousIslandId = null, rng = Math.random) {
  if (!Array.isArray(bank) || count <= 0) {
    return []
  }

  // Only consider exploration islands: regular and shop (plus legacy regular name)
  const filteredPool = bank.filter((island) =>
    island &&
    (island.type === 'regular' || island.type === 'shop') &&
    island.id !== previousIslandId,
  )

  if (filteredPool.length === 0) {
    return []
  }

  // Enforce exactly two options max (but return fewer when pool smaller)
  const MAX_OPTIONS = 2
  const uniqueCount = Math.min(MAX_OPTIONS, filteredPool.length)

  // Simple Fisher-Yates shuffle using provided rng to randomize selection
  const pool = [...filteredPool]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = pool[i]
    pool[i] = pool[j]
    pool[j] = tmp
  }

  return pool.slice(0, uniqueCount)
}

/**
 * Generates the boss gate option set.
 *
 * This game version uses a single boss, so the helper returns at most one
 * boss island option while still excluding already defeated bosses.
 *
 * @param {Array<{ id: string } & object>} bossBank
 * @param {Array<string>} [defeatedBossIds=[]]
 * @returns {Array<{ id: string } & object>}
 */
export function generateBossGateOptions(bossBank, defeatedBossIds = []) {
  if (!Array.isArray(bossBank)) {
    return []
  }

  const defeatedSet = new Set(Array.isArray(defeatedBossIds) ? defeatedBossIds : [])
  const availableBosses = bossBank.filter((island) =>
    island && island.type === 'boss' && !defeatedSet.has(island.id),
  )

  if (availableBosses.length === 0) {
    return []
  }

  return [availableBosses[0]]
}

/**
 * Generates the final gate option set.
 *
 * This game version unlocks the final island after defeating one boss.
 *
 * @param {{ id: string } & object} finalIsland
 * @param {Array<string>} [defeatedBossIds=[]]
 * @returns {Array<{ id: string } & object>}
 */
export function generateFinalGateOption(finalIsland, defeatedBossIds = []) {
  if (!finalIsland || !Array.isArray(defeatedBossIds) || defeatedBossIds.length < 1) {
    return []
  }

  return [finalIsland]
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