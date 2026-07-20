import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const hookSource = readFileSync(
  new URL('../../apps/mobile/src/features/sofra/useRhythmHistory.ts', import.meta.url),
  'utf8',
)
const cardSource = readFileSync(
  new URL('../../apps/mobile/src/features/sofra/RhythmHistoryCard.tsx', import.meta.url),
  'utf8',
)

describe('rhythm history error state', () => {
  it('exposes query errors instead of converting them to empty data', () => {
    expect(hookSource).toContain('useRhythmHistoryResult')
    expect(hookSource).toContain('() => requireApi().rhythmHistory(date)')
    expect(hookSource).not.toContain('catch')
    expect(hookSource).not.toContain('return null')
  })

  it('shows a retry action and keeps the empty state error-free', () => {
    expect(cardSource).toContain('historyQuery.error ?')
    expect(cardSource).toContain('Ritim geçmişini şu an getiremedik.')
    expect(cardSource).toContain('onPress={historyQuery.retry}')
    expect(cardSource).toContain('!historyQuery.error && history ?')
  })
})
