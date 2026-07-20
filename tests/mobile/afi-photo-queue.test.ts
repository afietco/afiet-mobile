import type { AfiPhotoFood } from '../../apps/mobile/src/features/nutrition/afiPhoto'
import {
  isHandledFood,
  removeConfirmedFood,
} from '../../apps/mobile/src/features/nutrition/afiPhotoQueue'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const afiPhotoSheet = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/AfiPhotoSheet.tsx', import.meta.url),
  'utf8',
)

const food = (name: string): AfiPhotoFood => ({
  name,
  groups: ['sebze'],
  measure: 'porsiyon',
  macros: { kcal: 1, protein: 0, carb: 0, fat: 0 },
  inPool: true,
})

describe('Afi photo confirmation queue', () => {
  it('keeps rejected foods excluded across later result turns', () => {
    const rejected = new Set(['içli köfte'])

    expect(isHandledFood('İÇLİ KÖFTE', new Set(), rejected)).toBe(true)
    expect(isHandledFood('Mercimek çorbası', new Set(), rejected)).toBe(false)
    expect(afiPhotoSheet).toContain('isHandledFood(f.name, logged, rejected)')
    expect(afiPhotoSheet).toContain('rejectedNames.current.add(norm(head.name))')
    expect(afiPhotoSheet).toContain('rejectedNames.current = new Set()')
  })

  it('preserves a new photo result that arrived while saving', () => {
    const latestQueue = [food('Yeni sonuç'), food('Diğer sonuç')]

    expect(removeConfirmedFood(latestQueue, 'Eski sonuç')).toBe(latestQueue)
  })

  it('removes only the confirmed food from the latest queue', () => {
    const latestQueue = [food('Kaydedilen'), food('Yeni sonuç')]

    expect(removeConfirmedFood(latestQueue, 'KAYDEDİLEN')).toEqual([food('Yeni sonuç')])
  })

  it('reads the latest React state through a functional update', () => {
    expect(afiPhotoSheet).toContain(
      'setQueue((current) => removeConfirmedFood(current, head.name))',
    )
  })
})
