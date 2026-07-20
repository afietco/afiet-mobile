import { describe, expect, it } from 'vitest'
import { SESSION_EXPIRED_REASON } from './auth-return'
import { getRootAuthRedirect, isPublicRootPath } from './root-auth-gate'

const completedFtue = {
  firstValueCaptured: true,
  welcomeIntroSeen: true,
}

describe('root authentication gate', () => {
  it.each(['/intro', '/first-meal', '/login', '/katil/ABC12345'])(
    'keeps the public route %s available anonymously',
    (pathname) => {
      expect(isPublicRootPath(pathname)).toBe(true)
      expect(
        getRootAuthRedirect({
          status: 'anon',
          sessionExpired: false,
          pathname,
          ...completedFtue,
        }),
      ).toBeNull()
    },
  )

  it('does not redirect while authentication is loading or active', () => {
    expect(
      getRootAuthRedirect({
        status: 'loading',
        sessionExpired: false,
        pathname: '/menum',
        ...completedFtue,
      }),
    ).toBeNull()
    expect(
      getRootAuthRedirect({
        status: 'authed',
        sessionExpired: false,
        pathname: '/menum',
        ...completedFtue,
      }),
    ).toBeNull()
  })

  it('preserves the first-time experience before login', () => {
    expect(
      getRootAuthRedirect({
        status: 'anon',
        sessionExpired: false,
        pathname: '/menum',
        welcomeIntroSeen: false,
        firstValueCaptured: false,
      }),
    ).toBe('/intro')
    expect(
      getRootAuthRedirect({
        status: 'anon',
        sessionExpired: false,
        pathname: '/menum',
        welcomeIntroSeen: true,
        firstValueCaptured: false,
      }),
    ).toBe('/first-meal')
  })

  it('sends an anonymous root route to login and preserves the return path', () => {
    expect(
      getRootAuthRedirect({
        status: 'anon',
        sessionExpired: false,
        pathname: '/menum',
        ...completedFtue,
      }),
    ).toEqual({ pathname: '/login', params: { returnTo: '/menum' } })
  })

  it('explains an expired session and preserves the interrupted root route', () => {
    expect(
      getRootAuthRedirect({
        status: 'anon',
        sessionExpired: true,
        pathname: '/profil',
        ...completedFtue,
      }),
    ).toEqual({
      pathname: '/login',
      params: { reason: SESSION_EXPIRED_REASON, returnTo: '/profil' },
    })
  })
})
