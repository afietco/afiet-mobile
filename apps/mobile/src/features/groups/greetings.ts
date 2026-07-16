import { useSyncExternalStore } from 'react'
import { todayISO } from '@afiet/core'

/**
 * Afiyet olsun jesti: MOCK katman. UI onaylanınca backend'e bağlanacak
 * (POST /v1/groups/:id/greetings + alınanlar GET'i); arayüz bilerek
 * repository desenindeki gibi dar tutuldu ki geçiş UI'a dokunmasın.
 *
 * Kurallar (aile-sofrasi.md): tek yönlü pozitif jest, üye başına günde 1,
 * yalnız o gün afiyette olan ve paylaşımı açık üyeye gönderilir.
 * Gönderimler kalıcı tutulacak (ileride oyunlaştırmaya bağlanabilir);
 * mock'ta oturum içi hafızada yaşar.
 */

export interface ReceivedGreetings {
  /** Gönderen görünen adları; kart tek cümlede birleştirir. */
  fromNames: string[]
  date: string
}

interface GreetingsState {
  /** Bugün afiyet olsun dediğim üye id'leri. */
  sentTo: Set<string>
  received: ReceivedGreetings | null
}

// DEMO tohumu: alınan-kart akışı cihazda görülebilsin diye açılışta bir
// selam bekliyor. Backend bağlanınca kalkar.
const state: GreetingsState = {
  sentTo: new Set(),
  received: { fromNames: ['Ayşe'], date: todayISO() },
}

const listeners = new Set<() => void>()
let snapshot = { ...state, sentTo: new Set(state.sentTo) }

function emit() {
  snapshot = { sentTo: new Set(state.sentTo), received: state.received }
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

/** Alınan selam kartı kapatıldı. */
export function dismissReceived() {
  state.received = null
  emit()
}
