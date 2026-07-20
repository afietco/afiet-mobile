import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

let stackAuth: typeof import('../../apps/mobile/src/features/auth/stackAuth')

beforeAll(async () => {
  vi.stubEnv('EXPO_PUBLIC_API_URL', 'https://api.example.test')
  vi.stubEnv('EXPO_PUBLIC_STACK_PROJECT_ID', 'test-project')
  vi.resetModules()
  stackAuth = await import('../../apps/mobile/src/features/auth/stackAuth')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

afterAll(() => {
  vi.unstubAllEnvs()
})

function mockRefreshError(status: number, code: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify({ code, error: 'Technical server message' }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
}

describe('refresh token error classification', () => {
  it('ends the session only for the expired-or-revoked refresh token code', async () => {
    mockRefreshError(401, 'REFRESH_TOKEN_NOT_FOUND_OR_EXPIRED')

    const error = await stackAuth.refreshAccessToken('expired-token').catch((caught) => caught)

    expect(error).toBeInstanceOf(stackAuth.InvalidRefreshTokenError)
  })

  it('keeps a schema-related 400 retryable instead of ending the session', async () => {
    mockRefreshError(400, 'SCHEMA_ERROR')
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const error = await stackAuth.refreshAccessToken('still-valid-token').catch((caught) => caught)

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(stackAuth.InvalidRefreshTokenError)
  })

  it('does not infer token invalidity from a 401 without the specific code', async () => {
    mockRefreshError(401, 'PROJECT_AUTHENTICATION_ERROR')
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const error = await stackAuth.refreshAccessToken('still-valid-token').catch((caught) => caught)

    expect(error).not.toBeInstanceOf(stackAuth.InvalidRefreshTokenError)
  })
})
