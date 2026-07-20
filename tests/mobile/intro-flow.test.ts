import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const introPath = fileURLToPath(
  new URL('../../apps/mobile/src/app/intro.tsx', import.meta.url),
)

describe('first-launch introduction flow', () => {
  it('never bypasses the introduction for a development-only gallery', async () => {
    const source = await readFile(introPath, 'utf8')

    expect(source).not.toContain('__DEV__')
    expect(source).not.toContain('/afi-galeri')
  })

  it('marks the introduction complete before opening the first meal route', async () => {
    const source = await readFile(introPath, 'utf8')
    const markComplete = source.indexOf("markFtueSeen('welcomeIntro')")
    const openFirstMeal = source.indexOf("router.replace('/first-meal')")

    expect(markComplete).toBeGreaterThan(-1)
    expect(openFirstMeal).toBeGreaterThan(markComplete)
  })
})
