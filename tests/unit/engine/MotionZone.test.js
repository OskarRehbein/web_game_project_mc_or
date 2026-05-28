import { describe, it, expect } from 'vitest'
import { computeMotionZone, resolveDirection } from '@/engine/combat/MotionZone.js'

const BASE = { x: 0, y: 150, width: 150, height: 300 }
const MOTION = { fromX: 0, toX: 810, durationMs: 1400 }

describe('computeMotionZone', () => {
    it('progress=0 → x === fromX (ltr)', () => {
        const z = computeMotionZone(BASE, MOTION, 'ltr', 0)
        expect(z.x).toBe(0)
    })

    it('progress=1 → x === toX (ltr)', () => {
        const z = computeMotionZone(BASE, MOTION, 'ltr', 1)
        expect(z.x).toBe(810)
    })

    it('progress=0.5 → x es el punto medio (ltr)', () => {
        const z = computeMotionZone(BASE, MOTION, 'ltr', 0.5)
        expect(z.x).toBeCloseTo(405)
    })

    it('directionMode rtl: progress=0 → x === toX', () => {
        const z = computeMotionZone(BASE, MOTION, 'rtl', 0)
        expect(z.x).toBe(810)
    })

    it('directionMode rtl: progress=1 → x === fromX', () => {
        const z = computeMotionZone(BASE, MOTION, 'rtl', 1)
        expect(z.x).toBe(0)
    })

    it('y, width y height no cambian', () => {
        const z = computeMotionZone(BASE, MOTION, 'ltr', 0.3)
        expect(z.y).toBe(BASE.y)
        expect(z.width).toBe(BASE.width)
        expect(z.height).toBe(BASE.height)
    })
})

describe('resolveDirection', () => {
    it('"ltr" → siempre ltr', () => {
        expect(resolveDirection('ltr', () => 0.9)).toBe('ltr')
        expect(resolveDirection('ltr', () => 0.0)).toBe('ltr')
    })

    it('"rtl" → siempre rtl', () => {
        expect(resolveDirection('rtl', () => 0.0)).toBe('rtl')
        expect(resolveDirection('rtl', () => 0.9)).toBe('rtl')
    })

    it('"random" con rng=()=>0 → ltr', () => {
        expect(resolveDirection('random', () => 0)).toBe('ltr')
    })

    it('"random" con rng=()=>0.9 → rtl', () => {
        expect(resolveDirection('random', () => 0.9)).toBe('rtl')
    })
})
