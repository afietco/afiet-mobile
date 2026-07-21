import { describe, expect, it } from 'vitest'
import { parsePushTarget, routeForPushTarget } from './push-target'

describe('push target routing', () => {
  it('rejects arbitrary URLs and unknown targets', () => {
    expect(parsePushTarget('https://example.com')).toBeNull()
    expect(parsePushTarget('settings')).toBeNull()
    expect(parsePushTarget({ target: 'meal' })).toBeNull()
  })

  it('keeps screens that must not be reachable from a payload out', () => {
    // Anonymous-only, dev-only and parameterised routes have no token, and a
    // raw path is never accepted even when it names a real screen.
    expect(parsePushTarget('login')).toBeNull()
    expect(parsePushTarget('intro')).toBeNull()
    expect(parsePushTarget('afi-galeri')).toBeNull()
    expect(parsePushTarget('katil')).toBeNull()
    expect(parsePushTarget('/hesap')).toBeNull()
  })

  it('maps the semantic targets its own producers send', () => {
    expect(routeForPushTarget('meal')).toEqual({
      pathname: '/(tabs)',
      params: { pushTarget: 'meal' },
    })
    expect(routeForPushTarget('notifications')).toEqual({
      pathname: '/(tabs)',
      params: { pushTarget: 'notifications' },
    })
    expect(routeForPushTarget('friend_requests')).toBe('/arkadaslarim')
  })

  it('maps every screen target the admin panel can pick', () => {
    // Mirrors pushTargets in the backend's push_broadcast_handlers.go.
    const screens = [
      'bugun',
      'beslenme',
      'vucudum',
      'grubum',
      'arkadaslarim',
      'besinler',
      'menum',
      'ekle',
      'profil',
      'hesap',
      'bilgilerim',
      'gorunum',
      'veri',
    ] as const

    for (const screen of screens) {
      expect(parsePushTarget(screen)).toBe(screen)
      expect(routeForPushTarget(screen)).toBeTruthy()
    }
    expect(routeForPushTarget('bugun')).toBe('/(tabs)')
    expect(routeForPushTarget('hesap')).toBe('/hesap')
  })
})
