import { describe, expect, it } from 'vitest'

import { safeAuthReturnPath } from './auth-return'

describe('safeAuthReturnPath', () => {
  it('keeps an internal application path', () => {
    expect(safeAuthReturnPath('/grubum')).toBe('/grubum')
  })

  it('uses the first value from repeated search parameters', () => {
    expect(safeAuthReturnPath(['/beslenme', '/vucudum'])).toBe('/beslenme')
  })

  it.each(['https://example.com', '//example.com', '/login', '/intro', undefined])(
    'falls back to home for unsafe return target %s',
    (value) => {
      expect(safeAuthReturnPath(value)).toBe('/')
    },
  )

  it('drops query parameters and fragments from a return path', () => {
    expect(safeAuthReturnPath('/hesap?mode=edit#profile')).toBe('/hesap')
  })
})
