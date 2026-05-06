/**
 * CollisionSystem — pure JS engine module, no Vue/PixiJS imports.
 *
 * Implements Axis-Aligned Bounding Box (AABB) collision detection.
 *
 * A rect is defined as { x, y, width, height } where (x, y) is the top-left corner.
 * Two rects collide only when they genuinely overlap (edge-touch is NOT a collision).
 */

/**
 * @typedef {Object} Rect
 * @property {number} x      - Left edge in pixels
 * @property {number} y      - Top edge in pixels
 * @property {number} width  - Width in pixels (> 0)
 * @property {number} height - Height in pixels (> 0)
 */

/**
 * @typedef {Rect & { id: string }} Zone
 * A named rectangle used as a hazard or platform zone in the combat arena.
 */

/**
 * @typedef {Rect & { id: string }} Entity
 * A named rectangle representing an actor (player, boss projectile, etc.).
 */

/**
 * @description Checks whether two axis-aligned bounding boxes overlap.
 *              Uses strict inequality so that rects sharing only an edge are NOT colliding.
 *              The check is commutative: checkCollision(a, b) === checkCollision(b, a).
 * @param {Rect} rectA - First bounding box
 * @param {Rect} rectB - Second bounding box
 * @returns {boolean} True only if the rects genuinely overlap on both axes
 */
export function checkCollision(rectA, rectB) {
  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  )
}

/**
 * @description Returns all zones that the given entity's bounding box overlaps.
 *              Iterates through every zone and applies checkCollision.
 *              Does not mutate the zones array.
 * @param {Entity} entity - The actor to check (player, hitbox, etc.)
 * @param {Zone[]} zones  - Array of hazard or platform zones in the arena
 * @returns {Zone[]} All zones that collide with the entity (may be empty)
 */
export function getCollisions(entity, zones) {
  return zones.filter((zone) => checkCollision(entity, zone))
}
