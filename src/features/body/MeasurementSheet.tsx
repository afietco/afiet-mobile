import { useEffect, useState } from 'react'
import { measurementRepo } from '../../data/repositories'
import type { Measurement, Sex } from '../../data/types'
import { formatShortTR, todayISO } from '../../lib/dates'
import { parseDecimal } from '../../lib/numbers'
import { Sheet } from '../../ui/Sheet'
import { WheelDatePicker } from '../../ui/inputs/WheelPicker'
import { IconCalendar, IconRuler } from '../../ui/icons'
import { formatNumber } from './bodyMetrics'

const HINT = 'Bu değer biraz alışılmadık görünüyor — kontrol eder misin?'

interface MeasurementSheetProps {
  profileId: number
  sex?: Sex
  /** Placeholder için son ölçüm */
  latest?: Measurement
  open: boolean
  onClose: () => void
}

/** Hızlı ölçüm girişi — kilo yeter; mezura ölçüleri isteğe bağlı */
export function MeasurementSheet({ profileId, sex, latest, open, onClose }: MeasurementSheetProps) {
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [neck, setNeck] = useState('')
  const [hip, setHip] = useState('')
  const [date, setDate] = useState(todayISO())
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setWeight('')
    setWaist('')
    setNeck('')
    setHip('')
    setDate(todayISO())
    setDatePickerOpen(false)
  }, [open])

  const weightNum = parseDecimal(weight)
  const weightValid = weightNum !== null && weightNum >= 20 && weightNum <= 300

  const girth = (s: string) => {
    if (s.trim() === '') return { value: undefined, valid: true }
    const n = parseDecimal(s)
    return { value: n ?? undefined, valid: n !== null && n >= 20 && n <= 250 }
  }
  const w = girth(waist)
  const n = girth(neck)
  const h = girth(hip)

  const canSave = weightValid && w.valid && n.valid && h.valid && date !== ''

  const save = async () => {
    if (!canSave) return
    await measurementRepo.upsertForDay(profileId, date, {
      weightKg: weightNum!,
      waistCm: w.value,
      neckCm: n.value,
      hipCm: h.value,
    })
    onClose()
  }

  const inputCls =
    'w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-violet-500'
  const invalid = (filled: boolean, valid: boolean) => filled && !valid

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <>
          <IconRuler className="h-5.5 w-5.5 text-violet-600 dark:text-violet-400" />
          Ölçüm Ekle
        </>
      }
    >
      <p className="mb-2 text-sm font-medium text-soft">Kilo (kg)</p>
      <input
        inputMode="decimal"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        placeholder={latest ? formatNumber(latest.weightKg) : 'örn. 72,5'}
        autoFocus
        className={inputCls}
      />
      <p className={`mt-1 text-xs text-amber-600 dark:text-amber-400 ${invalid(weight.trim() !== '', weightValid) ? '' : 'invisible'}`}>
        {HINT}
      </p>

      <p className="mb-1 py-2 text-sm font-medium text-soft">Mezura ölçüleri (isteğe bağlı)</p>

      <div className="mb-2">
          <p className="mb-3 text-xs text-faint">
            Bel + boyun (kadınlarda kalça da) ile vücut yağ oranını hesaplayabiliriz.
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="mb-1.5 text-sm font-medium text-soft">Bel (cm)</p>
              <input inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} className={inputCls} />
            </div>
            <div className="flex-1">
              <p className="mb-1.5 text-sm font-medium text-soft">Boyun (cm)</p>
              <input inputMode="decimal" value={neck} onChange={(e) => setNeck(e.target.value)} className={inputCls} />
            </div>
            <div className="flex-1">
              <p className="mb-1.5 text-sm font-medium text-soft">Kalça (cm)</p>
              <input inputMode="decimal" value={hip} onChange={(e) => setHip(e.target.value)} className={inputCls} />
            </div>
          </div>
          <p
            className={`mt-1 text-xs text-amber-600 dark:text-amber-400 ${
              invalid(waist.trim() !== '', w.valid) || invalid(neck.trim() !== '', n.valid) || invalid(hip.trim() !== '', h.valid)
                ? ''
                : 'invisible'
            }`}
          >
            {HINT}
          </p>
          {sex === 'erkek' && (
            <p className="mt-1 text-xs text-faint">Erkeklerde kalça ölçüsü hesapta kullanılmaz, yine de kaydedebilirsin.</p>
          )}
      </div>

      <div className="mb-5">
        <button
          type="button"
          onClick={() => setDatePickerOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-soft active:scale-[0.98]"
        >
          <IconCalendar className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
          {date === todayISO() ? 'Bugün' : formatShortTR(date)}
        </button>
        {datePickerOpen && (
          <div className="animate-slide-fade-in mt-2">
            <WheelDatePicker
              value={date}
              onChange={setDate}
              minYear={new Date().getFullYear() - 2}
              maxDate={todayISO()}
              accent="violet"
            />
          </div>
        )}
      </div>

      <button
        onClick={() => void save()}
        disabled={!canSave}
        className="w-full rounded-xl bg-violet-600 py-3.5 font-semibold text-white active:scale-[0.98] disabled:opacity-40"
      >
        Kaydet
      </button>
    </Sheet>
  )
}
