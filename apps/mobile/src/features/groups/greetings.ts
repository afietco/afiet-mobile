import { useSyncExternalStore } from 'react'
import { requireApi } from '@/data/api/apiHolder'
import { ApiError } from '@/data/api/client'

/**
 * Afiyet olsun jesti (aile-sofrasi.md): POST /v1/groups/:id/greetings
 * üzerinde optimistik istemci durumu. Buton dokunur dokunmaz "dedin"e
 * geçer; sunucu 409 dönerse (zaten dendi / alıcı uygun değil) durum
 * korunur, başka hatada geri alınır. Kalıcı gerçeklik sunucudadır:
 * grup görünümündeki member.greetedToday alanı cihazlar arası tutarlılığı
 * sağlar, buradaki küme yalnız oturum içi optimistik katmandır.
 */

interface GreetingsState {
  /** Bugün afiyet olsun dediğim üye id'leri (optimistik). */
  sentTo: Set<string>
}

const state: GreetingsState = {
  sentTo: new Set(),
}

const listeners = new Set<() => void>()
let snapshot = { sentTo: new Set(state.sentTo) }

function emit() {
  snapshot = { sentTo: new Set(state.sentTo) }
  for (const l of listeners) l()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useGreetings() {
  return useSyncExternalStore(subscribe, () => snapshot)
}

/** Bugün bu üyeye afiyet olsun dendi mi (optimistik katman)? */
export function sentToday(s: { sentTo: Set<string> }, userId: string): boolean {
  return s.sentTo.has(userId)
}

/** Afiyet olsun de — optimistik işaretle, sunucuya gönder. */
export function sendGreeting(groupId: string, toUserId: string, date: string) {
  state.sentTo.add(toUserId)
  emit()
  try {
    requireApi()
      .sendGreeting(groupId, toUserId, date)
      .catch((e: unknown) => {
        // 409 = bugün zaten dendi ya da alıcı şu an uygun değil — buton
        // "dedin" kalır (tekrar denemenin anlamı yok). Diğer hatalarda geri al.
        if (e instanceof ApiError && e.status === 409) return
        state.sentTo.delete(toUserId)
        emit()
      })
  } catch {
    // giriş yok: optimistik işaret geri alınır
    state.sentTo.delete(toUserId)
    emit()
  }
}
