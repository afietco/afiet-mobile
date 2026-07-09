import { useEffect, useState } from 'react'
import { profileRepo } from '../../data/repositories'
import {
  ACTIVITY_LEVELS,
  SEXES,
  type ActivityLevel,
  type Profile,
  type Sex,
} from '../../data/types'
import { todayISO } from '../../lib/dates'
import { parseDecimal } from '../../lib/numbers'
import { Sheet } from '../../ui/Sheet'
import { WheelDatePicker } from '../../ui/inputs/WheelPicker'
import { IconSparkles } from '../../ui/icons'
import { ageFromBirthDate } from './bodyMetrics'

const HINT = 'Bu değer biraz alışılmadık görünüyor — kontrol eder misin?'
const DEFAULT_BIRTH = '1995-06-15'

interface BodySetupSheetProps {
  profile: Profile
  open: boolean
  onClose: () => void
}

/** Vücudum kurulumu — cinsiyet, doğum tarihi, boy, aktivite (düzenlemede prefill) */
export function BodySetupSheet({ profile, open, onClose }: BodySetupSheetProps) {
  const [sex, setSex] = useState<Sex | null>(null)
  const [birthDate, setBirthDate] = useState('')
  const [height, setHeight] = useState('')
  const [activity, setActivity] = useState<ActivityLevel | null>(null)

  // Açılışta mevcut profil değerleriyle doldur
  useEffect(() => {
    if (!open) return
    setSex(profile.sex ?? null)
    setBirthDate(profile.birthDate ?? DEFAULT_BIRTH)
    setHeight(profile.heightCm != null ? String(profile.heightCm).replace('.', ',') : '')
    setActivity(profile.activityLevel ?? null)
  }, [open, profile])

  const heightNum = parseDecimal(height)
  const heightValid = heightNum !== null && heightNum >= 100 && heightNum <= 250
  const age = birthDate ? ageFromBirthDate(birthDate) : null
  const birthValid = age !== null && age >= 5 && age <= 120

  const complete = sex !== null && birthDate !== '' && height.trim() !== '' && activity !== null
  const canSave = complete && heightValid && birthValid

  const save = async () => {
    if (!canSave || !profile.id) return
    await profileRepo.updateBody(profile.id, {
      sex: sex!,
      birthDate,
      heightCm: heightNum!,
      activityLevel: activity!,
    })
    onClose()
  }

  const selectedRow = 'border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/50'
  const idleRow = 'border-line bg-surface'

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <>
          <IconSparkles className="h-5.5 w-5.5 text-violet-600 dark:text-violet-400" />
          Seni tanıyalım
        </>
      }
    >
      <p className="mb-4 text-sm text-soft">
        Bu bilgilerle BMI ve günlük enerji ihtiyacını kendiliğinden hesaplarız. Yalnızca bu
        cihazda saklanır.
      </p>

      <p className="mb-2 text-sm font-medium text-soft">Cinsiyet</p>
      <div className="mb-4 flex gap-2">
        {SEXES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSex(s.key)}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
              sex === s.key ? selectedRow : idleRow
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className="mb-2 text-sm font-medium text-soft">Doğum tarihi</p>
      <WheelDatePicker value={birthDate} onChange={setBirthDate} maxDate={todayISO()} />
      <p className={`mt-1 mb-3 text-xs text-amber-600 dark:text-amber-400 ${birthDate && !birthValid ? '' : 'invisible'}`}>
        {HINT}
      </p>

      <p className="mb-2 text-sm font-medium text-soft">Boy (cm)</p>
      <input
        inputMode="decimal"
        value={height}
        onChange={(e) => setHeight(e.target.value)}
        placeholder="örn. 168"
        className="mb-1 w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-violet-500"
      />
      <p className={`mb-3 text-xs text-amber-600 dark:text-amber-400 ${height.trim() && !heightValid ? '' : 'invisible'}`}>
        {HINT}
      </p>

      <p className="mb-2 text-sm font-medium text-soft">Aktivite düzeyi</p>
      <div className="mb-6 flex flex-col gap-2">
        {ACTIVITY_LEVELS.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setActivity(a.key)}
            className={`rounded-xl border px-4 py-2.5 text-left transition-colors ${
              activity === a.key ? selectedRow : idleRow
            }`}
          >
            <span className="block text-sm font-semibold">{a.label}</span>
            <span className="block text-xs text-soft">{a.description}</span>
          </button>
        ))}
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
