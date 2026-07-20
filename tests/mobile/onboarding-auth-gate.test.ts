import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const onboardingPath = fileURLToPath(
  new URL('../../apps/mobile/src/app/onboarding.tsx', import.meta.url),
)

describe('onboarding authentication gate', () => {
  it('keeps the form hidden until authentication finishes loading', async () => {
    const source = await readFile(onboardingPath, 'utf8')
    const loadingGate = source.indexOf("if (status === 'loading') return <PageSkeleton />")
    const anonymousGate = source.indexOf("if (status === 'anon') return <Redirect href=\"/login\" />")
    const form = source.indexOf('const stepIndex = STEPS.indexOf(step)')

    expect(loadingGate).toBeGreaterThan(-1)
    expect(anonymousGate).toBeGreaterThan(loadingGate)
    expect(form).toBeGreaterThan(anonymousGate)
  })
})
