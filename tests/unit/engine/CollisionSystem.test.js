import { describe, it, expect } from 'vitest'
import { checkCollision, getCollisions } from '@/engine/combat/CollisionSystem.js'

/**
 * Unit tests for CollisionSystem (AABB — Axis-Aligned Bounding Box).
 *
 * A rect is defined as { x, y, width, height } where (x, y) is the top-left corner.
 * Two rects collide when their bounding boxes overlap on both axes simultaneously.
 */

describe('CollisionSystem', () => {

  describe('checkCollision — two rects', () => {
    /**
     * @goal   Returns true when two rects clearly overlap
     * @input  rectA={x:0,y:0,w:50,h:50}, rectB={x:25,y:25,w:50,h:50}
     * @expect true
     */
    it('returns true for clearly overlapping rects', () => {
      const a = { x: 0, y: 0, width: 50, height: 50 }
      const b = { x: 25, y: 25, width: 50, height: 50 }
      expect(checkCollision(a, b)).toBe(true)
    })

    /**
     * @goal   Returns false when rects are separated on the X axis
     * @input  rectA={x:0,y:0,w:50,h:50}, rectB={x:100,y:0,w:50,h:50}
     * @expect false
     */
    it('returns false when rects are separated horizontally', () => {
      const a = { x: 0, y: 0, width: 50, height: 50 }
      const b = { x: 100, y: 0, width: 50, height: 50 }
      expect(checkCollision(a, b)).toBe(false)
    })

    /**
     * @goal   Returns false when rects are separated on the Y axis
     * @input  rectA={x:0,y:0,w:50,h:50}, rectB={x:0,y:100,w:50,h:50}
     * @expect false
     */
    it('returns false when rects are separated vertically', () => {
      const a = { x: 0, y: 0, width: 50, height: 50 }
      const b = { x: 0, y: 100, width: 50, height: 50 }
      expect(checkCollision(a, b)).toBe(false)
    })

    /**
     * @goal   Returns false when rects share only an edge (touching but not overlapping)
     * @input  rectA ends at x=50, rectB starts at x=50
     * @expect false (edge-touch is NOT a collision in AABB)
     */
    it('returns false when rects are exactly touching on an edge', () => {
      const a = { x: 0, y: 0, width: 50, height: 50 }
      const b = { x: 50, y: 0, width: 50, height: 50 }
      expect(checkCollision(a, b)).toBe(false)
    })

    /**
     * @goal   Returns true when one rect is fully inside the other
     * @input  outer={x:0,y:0,w:100,h:100}, inner={x:25,y:25,w:10,h:10}
     * @expect true
     */
    it('returns true when one rect is fully inside the other', () => {
      const outer = { x: 0, y: 0, width: 100, height: 100 }
      const inner = { x: 25, y: 25, width: 10, height: 10 }
      expect(checkCollision(outer, inner)).toBe(true)
    })

    /**
     * @goal   checkCollision is commutative — order of arguments does not matter
     * @input  rectA and rectB overlapping — test both orderings
     * @expect same result in both directions
     */
    it('is commutative (a,b) === (b,a)', () => {
      const a = { x: 0, y: 0, width: 60, height: 60 }
      const b = { x: 40, y: 40, width: 60, height: 60 }
      expect(checkCollision(a, b)).toBe(checkCollision(b, a))
    })

    /**
     * @goal   A rect collides with itself
     * @input  same rect for both arguments
     * @expect true
     */
    it('returns true when a rect is compared with itself', () => {
      const a = { x: 10, y: 10, width: 30, height: 30 }
      expect(checkCollision(a, a)).toBe(true)
    })
  })

  describe('getCollisions — entity vs zones', () => {
    /**
     * @goal   Returns empty array when entity does not overlap any zone
     * @input  entity at (0,0), zones all far away
     * @expect []
     */
    it('returns empty array when no collisions occur', () => {
      const entity = { id: 'player', x: 0, y: 0, width: 32, height: 32 }
      const zones = [
        { id: 'z1', x: 200, y: 200, width: 50, height: 50 },
        { id: 'z2', x: 400, y: 0, width: 50, height: 50 },
      ]
      expect(getCollisions(entity, zones)).toEqual([])
    })

    /**
     * @goal   Returns the colliding zone(s) when entity overlaps them
     * @input  entity overlaps zone z1 but not z2
     * @expect [z1]
     */
    it('returns only zones that the entity overlaps', () => {
      const entity = { id: 'player', x: 0, y: 0, width: 32, height: 32 }
      const zones = [
        { id: 'z1', x: 16, y: 16, width: 50, height: 50 },
        { id: 'z2', x: 500, y: 500, width: 50, height: 50 },
      ]
      const result = getCollisions(entity, zones)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('z1')
    })

    /**
     * @goal   Returns all zones when entity overlaps multiple
     * @input  entity at origin overlaps three stacked zones
     * @expect array with all 3 zones
     */
    it('returns all colliding zones when entity overlaps multiple', () => {
      const entity = { id: 'player', x: 10, y: 10, width: 32, height: 32 }
      const zones = [
        { id: 'a', x: 0, y: 0, width: 50, height: 50 },
        { id: 'b', x: 5, y: 5, width: 50, height: 50 },
        { id: 'c', x: 20, y: 20, width: 50, height: 50 },
      ]
      const result = getCollisions(entity, zones)
      expect(result).toHaveLength(3)
    })

    /**
     * @goal   Returns empty array when zones list is empty
     * @input  valid entity, zones=[]
     * @expect []
     */
    it('returns empty array when zones list is empty', () => {
      const entity = { id: 'player', x: 0, y: 0, width: 32, height: 32 }
      expect(getCollisions(entity, [])).toEqual([])
    })

    /**
     * @goal   Does not mutate the zones array
     * @input  entity overlapping one zone
     * @expect zones array unchanged after call
     */
    it('does not mutate the zones array', () => {
      const entity = { id: 'player', x: 0, y: 0, width: 32, height: 32 }
      const zones = [{ id: 'z', x: 0, y: 0, width: 50, height: 50 }]
      const original = [...zones]
      getCollisions(entity, zones)
      expect(zones).toEqual(original)
    })
  })
})
