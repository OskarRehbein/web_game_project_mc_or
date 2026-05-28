import { describe, it, expect } from 'vitest'
import { generateDynamicZones } from '@/engine/combat/DynamicZoneGenerator.js'

const ARENA_W = 960
const ARENA_H = 540
const CANDIDATES = [
    { x: 100, y: 150 }, { x: 300, y: 420 }, { x: 500, y: 160 },
    { x: 700, y: 400 }, { x: 180, y: 350 }, { x: 600, y: 300 },
]

// RNG determinista basado en seed simple para tests de reproducibilidad
function makeSeededRng(seed) {
    let s = seed
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff
        return (s >>> 0) / 0x100000000
    }
}

describe('generateDynamicZones — modo candidates', () => {
    it('genera exactamente count zonas', () => {
        const spec = { count: 3, mode: 'candidates', zoneSize: 100, candidates: CANDIDATES }
        const zones = generateDynamicZones(spec, ARENA_W, ARENA_H, makeSeededRng(42))
        expect(zones).toHaveLength(3)
    })

    it('todas las posiciones provienen del array candidates', () => {
        const spec = { count: 4, mode: 'candidates', zoneSize: 100, candidates: CANDIDATES }
        const zones = generateDynamicZones(spec, ARENA_W, ARENA_H, makeSeededRng(7))
        zones.forEach((z) => {
            const match = CANDIDATES.find((c) => c.x === z.x && c.y === z.y)
            expect(match, `zona {x:${z.x},y:${z.y}} no está en candidates`).toBeDefined()
        })
    })

    it('no repite la misma entrada del array en un mismo llamado', () => {
        const spec = { count: 4, mode: 'candidates', zoneSize: 100, candidates: CANDIDATES }
        const zones = generateDynamicZones(spec, ARENA_W, ARENA_H, makeSeededRng(13))
        const keys = zones.map((z) => `${z.x},${z.y}`)
        const unique = new Set(keys)
        expect(unique.size).toBe(zones.length)
    })

    it('width y height iguales a zoneSize', () => {
        const spec = { count: 2, mode: 'candidates', zoneSize: 80, candidates: CANDIDATES }
        const zones = generateDynamicZones(spec, ARENA_W, ARENA_H, makeSeededRng(1))
        zones.forEach((z) => {
            expect(z.width).toBe(80)
            expect(z.height).toBe(80)
        })
    })

    it('lanza error descriptivo si candidates no existe', () => {
        const spec = { count: 2, mode: 'candidates', zoneSize: 100 }
        expect(() => generateDynamicZones(spec, ARENA_W, ARENA_H, Math.random)).toThrow(
            /candidates/i
        )
    })
})

describe('generateDynamicZones — modo random', () => {
    it('genera exactamente count zonas', () => {
        const spec = { count: 5, mode: 'random', zoneSize: 100 }
        const zones = generateDynamicZones(spec, ARENA_W, ARENA_H, makeSeededRng(99))
        expect(zones).toHaveLength(5)
    })

    it('width === zoneSize y height === zoneSize', () => {
        const spec = { count: 3, mode: 'random', zoneSize: 120 }
        const zones = generateDynamicZones(spec, ARENA_W, ARENA_H, makeSeededRng(5))
        zones.forEach((z) => {
            expect(z.width).toBe(120)
            expect(z.height).toBe(120)
        })
    })

    it('ninguna zona sale del canvas', () => {
        const spec = { count: 10, mode: 'random', zoneSize: 100 }
        const zones = generateDynamicZones(spec, ARENA_W, ARENA_H, makeSeededRng(77))
        zones.forEach((z) => {
            expect(z.x).toBeGreaterThanOrEqual(0)
            expect(z.y).toBeGreaterThanOrEqual(0)
            expect(z.x + z.width).toBeLessThanOrEqual(ARENA_W)
            expect(z.y + z.height).toBeLessThanOrEqual(ARENA_H)
        })
    })

    it('mismo seed → mismo resultado', () => {
        const spec = { count: 4, mode: 'random', zoneSize: 100 }
        const a = generateDynamicZones(spec, ARENA_W, ARENA_H, makeSeededRng(42))
        const b = generateDynamicZones(spec, ARENA_W, ARENA_H, makeSeededRng(42))
        expect(a).toEqual(b)
    })

    it('distinto seed → resultado diferente', () => {
        const spec = { count: 4, mode: 'random', zoneSize: 100 }
        const a = generateDynamicZones(spec, ARENA_W, ARENA_H, makeSeededRng(1))
        const b = generateDynamicZones(spec, ARENA_W, ARENA_H, makeSeededRng(9999))
        expect(a).not.toEqual(b)
    })
})
