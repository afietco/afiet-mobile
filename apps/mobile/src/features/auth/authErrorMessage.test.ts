import { describe, expect, it } from 'vitest'
import { authErrorMessage } from './authErrorMessage'

const TURKISH_NETWORK_MESSAGE =
  'Şu anda bağlantı kuramadık. Birazdan tekrar deneyebilirsin.'

describe('authentication error messages', () => {
  it.each([
    'Network request failed',
    'Failed to fetch',
    'fetch failed',
    'Load failed',
    'NetworkError when attempting to fetch resource.',
    'The Internet connection appears to be offline.',
    'The connection was lost',
    'Request timed out',
  ])('localizes the platform network error %s', (message) => {
    expect(authErrorMessage(new TypeError(message))).toBe(TURKISH_NETWORK_MESSAGE)
  })

  it('localizes structured network error codes', () => {
    expect(authErrorMessage({ code: 'ERR_NETWORK' })).toBe(TURKISH_NETWORK_MESSAGE)
    expect(authErrorMessage({ code: 'network_error' })).toBe(TURKISH_NETWORK_MESSAGE)
  })

  it('preserves an already localized authentication error', () => {
    expect(authErrorMessage(new Error('E-posta veya şifre hatalı.'))).toBe(
      'E-posta veya şifre hatalı.',
    )
  })

  it('uses a calm fallback when no error message is available', () => {
    expect(authErrorMessage(null)).toBe('Bir şeyler ters gitti.')
  })
})
