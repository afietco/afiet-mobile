import { describe, expect, it } from 'vitest'

import { requireMobileEnvironment } from './configValidation'

describe('requireMobileEnvironment', () => {
  it('returns trimmed API and Stack Auth configuration', () => {
    expect(
      requireMobileEnvironment({
        apiUrl: ' https://api.example.com ',
        stackProjectId: ' stack-project ',
      }),
    ).toEqual({
      apiUrl: 'https://api.example.com',
      stackProjectId: 'stack-project',
    })
  })

  it('names every missing required variable', () => {
    expect(() => requireMobileEnvironment({})).toThrowError(
      'Missing required mobile environment variables: EXPO_PUBLIC_API_URL, ' +
        'EXPO_PUBLIC_STACK_PROJECT_ID. Configure the EAS build profile or a local .env file.',
    )
  })

  it('identifies a missing API URL when Stack Auth is configured', () => {
    expect(() => requireMobileEnvironment({ stackProjectId: 'stack-project' })).toThrowError(
      'Missing required mobile environment variables: EXPO_PUBLIC_API_URL.',
    )
  })

  it('identifies a missing Stack Auth project when the API is configured', () => {
    expect(() => requireMobileEnvironment({ apiUrl: 'https://api.example.com' })).toThrowError(
      'Missing required mobile environment variables: EXPO_PUBLIC_STACK_PROJECT_ID.',
    )
  })
})
