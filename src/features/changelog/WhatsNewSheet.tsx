import { useEffect, useState } from 'react'
import { CHANGELOG } from '../../data/changelog'
import { Sheet } from '../../ui/Sheet'
import { IconSparkles } from '../../ui/icons'

const LAST_SEEN_KEY = 'fh:lastSeenVersion'

const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' })

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return dateFmt.format(new Date(y, m - 1, d))
}

/** Sürüm notlarını gösteren sheet — hem otomatik hem Profil'den açılır */
export function WhatsNewSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const latest = CHANGELOG[0]
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <>
          Yenilikler
          <IconSparkles className="h-5 w-5 text-amber-500" />
        </>
      }
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
          v{latest.version}
        </span>
        <span className="text-sm text-faint">{formatDate(latest.date)}</span>
      </div>

      <ul className="mb-6 flex flex-col gap-3">
        {latest.highlights.map((h, i) => (
          <li
            key={i}
            className="animate-slide-fade-in flex items-start gap-3"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg dark:bg-emerald-950/60">
              {h.emoji}
            </span>
            <p className="pt-1.5 text-sm text-ink">{h.text}</p>
          </li>
        ))}
      </ul>

      <button
        onClick={onClose}
        className="w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white active:scale-[0.98]"
      >
        Süper 👍
      </button>
    </Sheet>
  )
}

/**
 * Güncelleme sonrası "Yenilikler"i bir kez gösterir.
 * - Yeni kurulum (profil yok): sürüm sessizce işaretlenir, sheet çıkmaz.
 * - Mevcut kullanıcı + yeni sürüm: bir kereliğine gösterilir.
 */
export function WhatsNewAutoPrompt() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const lastSeen = localStorage.getItem(LAST_SEEN_KEY)
    const hasProfile = localStorage.getItem('fh:activeProfileId') !== null
    if (!hasProfile) {
      // Yeni kurulumda "yenilik" anlamsız — mevcut sürümü görülmüş say
      if (!lastSeen) localStorage.setItem(LAST_SEEN_KEY, __APP_VERSION__)
      return
    }
    if (lastSeen !== __APP_VERSION__ && CHANGELOG[0]?.version === __APP_VERSION__) {
      setOpen(true)
    }
  }, [])

  const close = () => {
    localStorage.setItem(LAST_SEEN_KEY, __APP_VERSION__)
    setOpen(false)
  }

  return <WhatsNewSheet open={open} onClose={close} />
}
