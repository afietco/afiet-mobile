import { describe, expect, it } from 'vitest'
import { jsonEqual } from './equal'

describe('jsonEqual', () => {
  it('matches primitives and nested JSON regardless of object key order', () => {
    expect(jsonEqual('afiet', 'afiet')).toBe(true)
    expect(jsonEqual({ a: 1, nested: [true, null] }, { nested: [true, null], a: 1 })).toBe(true)
  })

  it('detects value, key, array-order, and array-length differences', () => {
    expect(jsonEqual({ value: 1 }, { value: 2 })).toBe(false)
    expect(jsonEqual({ value: 1 }, { other: 1 })).toBe(false)
    expect(jsonEqual([1, 2], [2, 1])).toBe(false)
    expect(jsonEqual([1], [1, 2])).toBe(false)
  })

  it('only treats unsupported object types as equal by reference', () => {
    const date = new Date('2026-07-20T00:00:00.000Z')
    const map = new Map([['key', 'value']])

    expect(jsonEqual(date, date)).toBe(true)
    expect(jsonEqual(date, new Date(date))).toBe(false)
    expect(jsonEqual(map, map)).toBe(true)
    expect(jsonEqual(map, new Map(map))).toBe(false)
  })
})
