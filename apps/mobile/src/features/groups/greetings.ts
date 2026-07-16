import { useSyncExternalStore } from 'react'

/**
 * Afiyet olsun jesti: MOCK katman. UI onaylanınca backend'e bağlanacak
 * (POST /v1/groups/:id/greetings + alınanlar GET'i); arayüz bilerek
 * repository desenindeki gibi dar tutuldu ki geçiş UI'a dokunmasın.
 *
 * Kurallar (aile-sofrasi.md): tek yönlü pozitif jest, üye başına günde 1,
 * yalnız o gün afiyette olan ve paylaşımı açık üyeye gönderilir.
 * Gönderimler kalıcı tutulacak (ileride oyunlaştırmaya bağlanabilir);
 * mock'ta oturum içi hafızada yaşar. Alınan selamlar bildirim merkezine
 * düşer (features/notifications).
 */

interface GreetingsState {
  /** Bugün afiyet olsun dediğim üye id'leri. */
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

/** Bugün bu üyeye afiyet olsun dendi mi? */
export function sentToday(s: { sentTo: Set<string> }, userId: string): boolean {
  return s.sentTo.has(userId)
}

/** Afiyet olsun de (mock: yalnız yerelde işaretler). */
export function sendGreeting(_groupId: string, toUserId: string) {
  state.sentTo.add(toUserId)
  emit()
}
