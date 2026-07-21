import type { Href } from 'expo-router'

// Targets are opaque tokens, never paths. The payload can only name a token
// from this union, and this module owns the token-to-route mapping, so a push
// can never navigate anywhere the app did not choose in advance. Never pass a
// path taken from the payload to router.push.
//
// The semantic targets come from the app's own producers (meal reminders,
// week closures, social). The screen targets are what the admin panel offers;
// they mirror pushTargets in the backend's push_broadcast_handlers.go, and the
// two lists must be updated together.
export type PushTarget =
  | 'meal'
  | 'week_closure'
  | 'notifications'
  | 'friend_requests'
  | 'friends'
  | 'bugun'
  | 'beslenme'
  | 'vucudum'
  | 'grubum'
  | 'arkadaslarim'
  | 'besinler'
  | 'menum'
  | 'ekle'
  | 'profil'
  | 'hesap'
  | 'bilgilerim'
  | 'gorunum'
  | 'veri'

const targets = new Set<PushTarget>([
  'meal',
  'week_closure',
  'notifications',
  'friend_requests',
  'friends',
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
])

export function parsePushTarget(value: unknown): PushTarget | null {
  return typeof value === 'string' && targets.has(value as PushTarget)
    ? (value as PushTarget)
    : null
}

// The switch stays exhaustive over PushTarget on purpose: adding a token
// without a route breaks the build instead of shipping a dead notification.
export function routeForPushTarget(target: PushTarget): Href {
  switch (target) {
    case 'friend_requests':
    case 'friends':
    case 'arkadaslarim':
      return '/arkadaslarim'
    case 'beslenme':
      return '/beslenme'
    case 'vucudum':
      return '/vucudum'
    case 'grubum':
      return '/grubum'
    case 'besinler':
      return '/besinler'
    case 'menum':
      return '/menum'
    case 'ekle':
      return '/ekle'
    case 'profil':
      return '/profil'
    case 'hesap':
      return '/hesap'
    case 'bilgilerim':
      return '/bilgilerim'
    case 'gorunum':
      return '/gorunum'
    case 'veri':
      return '/veri'
    case 'bugun':
      return '/(tabs)'
    case 'meal':
    case 'week_closure':
    case 'notifications':
      return { pathname: '/(tabs)', params: { pushTarget: target } }
  }
}
