import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const LOGIN = new URL('../../apps/mobile/src/app/login.tsx', import.meta.url)

/**
 * Signing up with Apple or Google used to demand the username field first.
 * Whoever tapped the social button without filling it got a red validation
 * line and no way forward, on a form whose whole point is the one tap route.
 */
describe('social sign up and the username field', () => {
  it('does not block Apple or Google on an untouched username', async () => {
    const source = await readFile(LOGIN, 'utf8')

    /* Scoped to the two social handlers on purpose: the email form's own guard
       is meant to stay strict. Each social body must test the field for being
       non-empty before it judges it; a bare `!isValidUsername(username)` there
       is the regression. */
    for (const handler of ['submitApple', 'submitGoogle']) {
      const start = source.indexOf(`async function ${handler}(`)
      expect(start, `${handler} not found`).toBeGreaterThan(-1)
      const body = source.slice(start, start + 900)
      expect(body, handler).toMatch(/username\.trim\(\) && !isValidUsername\(username\)/)
    }
  })

  it('sends no username at all rather than an empty one', async () => {
    const source = await readFile(LOGIN, 'utf8')
    // An empty string is a value; the backend must see absence instead.
    expect(source).not.toMatch(/mode === 'signup' \? normalizeUsername\(username\)/)
    expect(source).toMatch(/username\.trim\(\) \? normalizeUsername\(username\) : undefined/)
  })

  it('still requires a username when signing up with an email', async () => {
    const source = await readFile(LOGIN, 'utf8')
    /* The email form has no other identity to fall back on, so the field stays
       mandatory there. Only the social route is exempt. */
    expect(source).toContain("(mode === 'signup' && !username)")
  })
})
