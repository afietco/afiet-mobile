import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { shouldCheckWeekClosure } from '../../apps/mobile/src/features/sofra/weekClosureSchedule'

const hookSource = readFileSync(
  new URL('../../apps/mobile/src/features/sofra/useWeekClosure.ts', import.meta.url),
  'utf8',
)
const rootLayoutSource = readFileSync(
  new URL('../../apps/mobile/src/app/_layout.tsx', import.meta.url),
  'utf8',
)
const todayScreenSource = readFileSync(
  new URL('../../apps/mobile/src/app/(tabs)/index.tsx', import.meta.url),
  'utf8',
)

describe('week closure lifecycle', () => {
  it('checks once per successful local day and becomes due on the next day', () => {
    expect(shouldCheckWeekClosure(null, '2026-07-20')).toBe(true)
    expect(shouldCheckWeekClosure('2026-07-20', '2026-07-20')).toBe(false)
    expect(shouldCheckWeekClosure('2026-07-20', '2026-07-21')).toBe(true)
  })

  it('refreshes on foreground and retries failed checks', () => {
    expect(hookSource).toContain("AppState.addEventListener('change'")
    expect(hookSource).toContain("if (state === 'active')")
    expect(hookSource).toContain('retryTimer.current = setTimeout')
    expect(hookSource).not.toContain('checkedThisLaunch')
  })

  it('hosts the celebration at the authenticated root instead of the Today tab', () => {
    expect(rootLayoutSource).toContain('<WeekClosureHost />')
    expect(rootLayoutSource).toContain("status === 'authed'")
    expect(todayScreenSource).not.toContain('useWeekClosure')
    expect(todayScreenSource).not.toContain('WeekCloseCelebration')
  })
})
