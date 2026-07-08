import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type ThemePref = 'light' | 'dark' | 'system'

const KEY = 'fh:theme'
const listeners = new Set<() => void>()
const media = window.matchMedia('(prefers-color-scheme: dark)')

function readPref(): ThemePref {
  const raw = localStorage.getItem(KEY)
  return raw === 'light' || raw === 'dark' ? raw : 'system'
}

/** Tercihi <html class="dark"> + theme-color meta'sına uygular.
    Açılıştaki ilk uygulama index.html'deki erken script'te (flash önleme). */
function apply(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && media.matches)
  document.documentElement.classList.toggle('dark', dark)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? '#020617' : '#f8fafc')
}

export function setThemePref(pref: ThemePref) {
  if (pref === 'system') localStorage.removeItem(KEY)
  else localStorage.setItem(KEY, pref)
  apply(pref)
  listeners.forEach((l) => l())
}

export function useTheme() {
  const pref = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    readPref,
  )

  // Sistem tercihi değişirse (ve "system" seçiliyse) canlı izle
  useEffect(() => {
    const onChange = () => {
      if (readPref() === 'system') apply('system')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const setPref = useCallback((p: ThemePref) => setThemePref(p), [])
  return { pref, setPref }
}
