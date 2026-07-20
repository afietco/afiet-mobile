import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const waterCard = readFileSync(
  new URL('../../apps/mobile/src/features/home/WaterMiniCard.tsx', import.meta.url),
  'utf8',
)
const groupHome = readFileSync(
  new URL('../../apps/mobile/src/features/groups/GroupHome.tsx', import.meta.url),
  'utf8',
)

describe('optimistic update feedback', () => {
  it('explains a water rollback at the failure site', () => {
    expect(waterCard).toMatch(
      /setGlasses[\s\S]*?\.catch\(\(\) => \{[\s\S]*?setOptimistic\(null\)[\s\S]*?Alert\.alert\(\s*'Kaydedemedik'/,
    )
  })

  it('explains a greeting rollback after the store rejects', () => {
    expect(groupHome).toMatch(
      /sendGreeting[\s\S]*?\.catch\(\(\) => \{[\s\S]*?Alert\.alert\(\s*'İletemedik'/,
    )
  })
})
