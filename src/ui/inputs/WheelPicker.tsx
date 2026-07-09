import { useEffect, useRef, type KeyboardEvent } from 'react'

/* iOS tarzı kaydırmalı seçim çarkı — native input[type=date] yerine
   uygulamanın kendi dilinde, temaya uyumlu bir seçici. */

const ITEM_H = 44
const VISIBLE = 5
const PAD = (ITEM_H * (VISIBLE - 1)) / 2

export interface WheelItem {
  key: number
  label: string
}

interface WheelColumnProps {
  items: WheelItem[]
  value: number
  onChange: (key: number) => void
  ariaLabel: string
  className?: string
}

/** Tek sütun: scroll-snap ile ortadaki öğe seçilir, öğeye dokununca oraya kayar */
export function WheelColumn({ items, value, onChange, ariaLabel, className = 'flex-1' }: WheelColumnProps) {
  const ref = useRef<HTMLDivElement>(null)
  const settleTimer = useRef(0)
  const userScrolling = useRef(false)

  // İlk açılışta ve dışarıdan değer değişiminde çark hizalanır;
  // kullanıcının süren kaydırmasına araya girilmez
  useEffect(() => {
    const el = ref.current
    if (!el || userScrolling.current) return
    const idx = items.findIndex((i) => i.key === value)
    if (idx < 0) return
    const target = idx * ITEM_H
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTop = target
  }, [value, items])

  const handleScroll = () => {
    const el = ref.current
    if (!el) return
    userScrolling.current = true
    window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => {
      userScrolling.current = false
    }, 180)
    const idx = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_H)))
    const key = items[idx]?.key
    if (key !== undefined && key !== value) onChange(key)
  }

  const selectedIdx = items.findIndex((i) => i.key === value)

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const next = Math.min(
      items.length - 1,
      Math.max(0, selectedIdx + (e.key === 'ArrowDown' ? 1 : -1)),
    )
    ref.current?.scrollTo({ top: next * ITEM_H, behavior: 'smooth' })
  }

  return (
    <div className={`relative ${className}`} style={{ height: ITEM_H * VISIBLE }}>
      <div
        ref={ref}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="listbox"
        aria-label={ariaLabel}
        className="scrollbar-none h-full snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
      >
        <div style={{ height: PAD }} aria-hidden />
        {items.map((item, idx) => {
          const selected = item.key === value
          return (
            <button
              key={item.key}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => ref.current?.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })}
              className={`flex w-full snap-center items-center justify-center transition-all duration-150 ${
                selected ? 'text-lg font-extrabold text-ink' : 'font-medium text-faint'
              }`}
              style={{ height: ITEM_H }}
            >
              {item.label}
            </button>
          )
        })}
        <div style={{ height: PAD }} aria-hidden />
      </div>
      {/* Seçim değişimi ekran okuyucuya duyurulur */}
      <span className="sr-only" aria-live="polite">
        {ariaLabel}: {items[selectedIdx]?.label}
      </span>
    </div>
  )
}

const MONTHS_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
]

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

const pad2 = (n: number) => String(n).padStart(2, '0')

interface WheelDatePickerProps {
  /** YYYY-MM-DD */
  value: string
  onChange: (iso: string) => void
  minYear?: number
  maxYear?: number
  /** YYYY-MM-DD — ilerisi seçilirse bu tarihe kelepçelenir */
  maxDate?: string
  /** Bölümün aksan rengine uyum (Vücudum → violet) */
  accent?: 'emerald' | 'violet'
}

/** Gün / Ay / Yıl çarklı tarih seçici */
export function WheelDatePicker({
  value,
  onChange,
  minYear,
  maxYear,
  maxDate,
  accent = 'emerald',
}: WheelDatePickerProps) {
  const currentYear = new Date().getFullYear()
  const yMax = maxYear ?? currentYear
  const yMin = minYear ?? yMax - 100
  const [y, m, d] = value.split('-').map(Number)

  const set = (ny: number, nm: number, nd: number) => {
    const clampedDay = Math.min(nd, daysInMonth(ny, nm))
    const iso = `${ny}-${pad2(nm)}-${pad2(clampedDay)}`
    onChange(maxDate && iso > maxDate ? maxDate : iso)
  }

  const days: WheelItem[] = Array.from({ length: daysInMonth(y, m) }, (_, i) => ({
    key: i + 1,
    label: String(i + 1),
  }))
  const months: WheelItem[] = MONTHS_TR.map((label, i) => ({ key: i + 1, label }))
  const years: WheelItem[] = Array.from({ length: yMax - yMin + 1 }, (_, i) => ({
    key: yMin + i,
    label: String(yMin + i),
  }))

  const band =
    accent === 'violet'
      ? 'bg-violet-500/10 ring-violet-500/20'
      : 'bg-emerald-500/10 ring-emerald-500/20'

  return (
    <div className="relative rounded-3xl bg-surface p-2 shadow-sm">
      {/* Ortadaki seçim bandı */}
      <div
        className={`pointer-events-none absolute inset-x-3 top-1/2 h-11 -translate-y-1/2 rounded-2xl ring-1 ${band}`}
      />
      <div className="flex gap-1">
        <WheelColumn items={days} value={d} onChange={(nd) => set(y, m, nd)} ariaLabel="Gün" className="w-16 shrink-0" />
        <WheelColumn items={months} value={m} onChange={(nm) => set(y, nm, d)} ariaLabel="Ay" className="flex-1" />
        <WheelColumn items={years} value={y} onChange={(ny) => set(ny, m, d)} ariaLabel="Yıl" className="w-20 shrink-0" />
      </div>
      {/* Üst/alt yumuşak solma — seçili satıra odak */}
      <div className="pointer-events-none absolute inset-x-2 top-2 h-14 rounded-t-3xl bg-gradient-to-b from-surface to-transparent" />
      <div className="pointer-events-none absolute inset-x-2 bottom-2 h-14 rounded-b-3xl bg-gradient-to-t from-surface to-transparent" />
    </div>
  )
}
