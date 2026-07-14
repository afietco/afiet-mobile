import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSyncExternalStore } from 'react'

/**
 * Grup emoji logosu — GEÇİCİ (Faz A / UI) katman.
 *
 * Backend'de henüz `emoji` alanı yok; seçimler cihazda AsyncStorage'da tutulur
 * (`fh:groupEmoji` → { [groupId]: emoji } JSON'u). Faz B'de alan API'ye taşınır
 * ve bu store kaldırılır — UI yalnızca useGroupEmoji/setGroupEmoji kullandığından
 * geçiş tek dosyada biter. Emoji seçilmemiş gruba id'den türeyen deterministik
 * bir varsayılan atanır: her grubun ilk andan bir logosu olur ve bu logo tüm
 * render'larda aynı kalır.
 */

/** Grup logosu seçenekleri (profil avatarlarından ayrı, sofra/aile temalı). */
export const GROUP_EMOJIS = ['👨‍👩‍👧‍👦', '🏠', '🍲', '🥗', '🧡', '🌱', '💪', '🏃', '🍎', '☀️', '⭐', '🫶']

const KEY = 'fh:groupEmoji'

let map: Record<string, string> = {}
const listeners = new Set<() => void>()

/** Root layout splash gizlenmeden önce çağırır (ftueFlags ile aynı desen). */
export async function loadGroupEmojis(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    if (raw) map = JSON.parse(raw) as Record<string, string>
  } catch {
    // okunamazsa varsayılanlarla devam
  }
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** id'den deterministik varsayılan — seçim yoksa da her grubun logosu olsun. */
function defaultEmoji(groupId: string): string {
  let h = 0
  for (let i = 0; i < groupId.length; i++) h = (h * 31 + groupId.charCodeAt(i)) >>> 0
  return GROUP_EMOJIS[h % GROUP_EMOJIS.length]!
}

export function getGroupEmoji(groupId: string): string {
  return map[groupId] ?? defaultEmoji(groupId)
}

export function setGroupEmoji(groupId: string, emoji: string) {
  map = { ...map, [groupId]: emoji }
  void AsyncStorage.setItem(KEY, JSON.stringify(map))
  listeners.forEach((l) => l())
}

export function useGroupEmoji(groupId: string | null): string | null {
  return useSyncExternalStore(subscribe, () => (groupId ? getGroupEmoji(groupId) : null))
}
