import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { measurementRepo, profileRepo } from '../../data/repositories'
import {
  ACTIVITY_LEVELS,
  SEXES,
  type ActivityLevel,
  type Sex,
} from '@afiet/core'
import { todayISO } from '@afiet/core'
import { formatDecimalTR, parseDecimal } from '@afiet/core'
import { EmojiPicker } from '../../ui/inputs/EmojiPicker'
import { NumberDial } from '../../ui/inputs/NumberDial'
import { TextField } from '../../ui/inputs/TextField'
import { WheelDatePicker } from '../../ui/inputs/WheelPicker'
import { IconBowl, IconCheck, IconChevronRight, IconSparkles } from '../../ui/icons'
import { ageFromBirthDate } from '@afiet/core'
import { setActiveProfileId } from '../profile/useActiveProfile'

/* Onboarding — her ekranda tek soru. Kullanıcı profili burada, Vücudum
   kurulumundaki verilerle birlikte oluşturulur; uygulamaya hazır girilir. */

const STEPS = ['welcome', 'name', 'emoji', 'sex', 'birth', 'height', 'activity', 'weight', 'done'] as const
type Step = (typeof STEPS)[number]

const QUESTIONS: Step[] = ['name', 'emoji', 'sex', 'birth', 'height', 'activity', 'weight']

const HINT = 'Bu değer biraz alışılmadık görünüyor — kontrol eder misin?'
const DEFAULT_BIRTH = '1995-06-15'

/* Cevaplar oturum boyunca sessionStorage'da korunur — sekme ölse/yenilense de
   akış kaldığı adımdan sürer (kalıcı değil: tarayıcı kapanınca temizlenir). */
const DRAFT_KEY = 'fh:onboarding-draft'

interface OnboardingDraft {
  stepIdx: number
  name: string
  emoji: string | null
  sex: Sex | null
  birthDate: string
  height: string
  activity: ActivityLevel | null
  weight: string
}

function loadDraft(): Partial<OnboardingDraft> {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}') as Partial<OnboardingDraft>
  } catch {
    return {}
  }
}

const selectedCard =
  'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/40'
const idleCard = 'border-line bg-surface'

function Question({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <>
      <h1 className="text-[1.65rem] leading-snug font-extrabold tracking-tight">{title}</h1>
      {hint && <p className="mt-2 text-soft">{hint}</p>}
      <div className="mt-7">{children}</div>
    </>
  )
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-emerald-600 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
    >
      {children}
    </button>
  )
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const [draft] = useState(loadDraft)
  const [stepIdx, setStepIdx] = useState(() => Math.min(draft.stepIdx ?? 0, STEPS.length - 1))
  const [dir, setDir] = useState<1 | -1>(1)
  const [name, setName] = useState(draft.name ?? '')
  const [emoji, setEmoji] = useState<string | null>(draft.emoji ?? null)
  const [sex, setSex] = useState<Sex | null>(draft.sex ?? null)
  const [birthDate, setBirthDate] = useState(draft.birthDate ?? DEFAULT_BIRTH)
  const [height, setHeight] = useState(draft.height ?? '')
  const [activity, setActivity] = useState<ActivityLevel | null>(draft.activity ?? null)
  const [weight, setWeight] = useState(draft.weight ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ stepIdx, name, emoji, sex, birthDate, height, activity, weight }),
    )
  }, [stepIdx, name, emoji, sex, birthDate, height, activity, weight])

  const step = STEPS[stepIdx]
  const qIdx = QUESTIONS.indexOf(step)

  const go = (d: 1 | -1) => {
    setDir(d)
    setStepIdx((i) => Math.min(STEPS.length - 1, Math.max(0, i + d)))
  }

  const age = ageFromBirthDate(birthDate)
  const heightNum = parseDecimal(height)
  const heightValid = heightNum !== null && heightNum >= 100 && heightNum <= 250
  const weightNum = parseDecimal(weight)
  const weightValid = weightNum !== null && weightNum >= 20 && weightNum <= 300

  const stepValid: Record<Step, boolean> = {
    welcome: true,
    name: name.trim().length > 0,
    emoji: emoji !== null,
    sex: sex !== null,
    birth: age >= 5 && age <= 120,
    height: heightValid,
    activity: activity !== null,
    weight: weightValid,
    done: true,
  }

  const save = async () => {
    if (saving) return
    setSaving(true)
    const id = await profileRepo.create({
      name: name.trim(),
      emoji: emoji!,
      sex: sex!,
      birthDate,
      heightCm: heightNum!,
      activityLevel: activity!,
    })
    if (weightNum !== null && weightValid) {
      await measurementRepo.upsertForDay(id, todayISO(), { weightKg: weightNum })
    }
    sessionStorage.removeItem(DRAFT_KEY)
    // Profil oluşunca App'teki liveQuery uygulamayı kendiliğinden açar;
    // hangi URL'de başlanmış olursa olsun Bugün ekranına inilir
    setActiveProfileId(id)
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pt-5 pb-8">
      {step !== 'welcome' && (
        <header className="mb-6 flex items-center gap-3">
          <button
            onClick={() => go(-1)}
            aria-label="Geri"
            className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-faint active:bg-muted"
          >
            <IconChevronRight className="h-5 w-5 rotate-180" />
          </button>
          {qIdx >= 0 && (
            <>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-out"
                  style={{ width: `${((qIdx + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-semibold text-faint">
                {qIdx + 1}/{QUESTIONS.length}
              </span>
            </>
          )}
        </header>
      )}

      <div key={step} className={`flex flex-1 flex-col ${dir === 1 ? 'animate-step-fwd' : 'animate-step-back'}`}>
        {step === 'welcome' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/30">
              <IconBowl className="h-12 w-12 text-white" strokeWidth={1.6} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              afiet&apos;e hoş geldin 🌱
            </h1>
            <p className="mt-3 max-w-xs text-soft">
              Sayma, dengele: beslenmeni ve vücudunu yargısız, sade bir dille takip et.
              Önce seni tanıyalım — bir dakikadan kısa sürer.
            </p>
          </div>
        )}

        {step === 'name' && (
          <Question title="Sana nasıl seslenelim?" hint="İsmin yalnızca bu cihazda saklanır.">
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="İsmin"
              maxLength={20}
              autoFocus
              enterKeyHint="next"
              onKeyDown={(e) => e.key === 'Enter' && stepValid.name && go(1)}
            />
          </Question>
        )}

        {step === 'emoji' && (
          <Question title="Seni hangisi anlatıyor?" hint="Avatarın — sonra Profil'den değiştirebilirsin.">
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </Question>
        )}

        {step === 'sex' && (
          <Question title="Cinsiyetin?" hint="Enerji ihtiyacı ve yağ oranı hesaplarında kullanılır.">
            <div className="flex gap-3">
              {SEXES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSex(s.key)}
                  className={`relative flex-1 rounded-2xl border-2 py-7 text-lg font-bold shadow-sm transition-all active:scale-[0.97] ${
                    sex === s.key ? selectedCard : idleCard
                  }`}
                >
                  {s.label}
                  {sex === s.key && (
                    <span className="animate-pop-in absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <IconCheck className="h-4 w-4" strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Question>
        )}

        {step === 'birth' && (
          <Question title="Doğum tarihin?" hint="Yaşını enerji ihtiyacı hesabında kullanırız.">
            <WheelDatePicker value={birthDate} onChange={setBirthDate} maxDate={todayISO()} />
            <p className={`mt-3 text-center text-sm ${stepValid.birth ? 'text-soft' : 'text-amber-600 dark:text-amber-400'}`}>
              {stepValid.birth ? `${age} yaşındasın` : HINT}
            </p>
          </Question>
        )}

        {step === 'height' && (
          <Question title="Boyun kaç santim?">
            <NumberDial
              value={height}
              onChange={setHeight}
              unit="cm"
              min={100}
              max={250}
              fallback={170}
              ariaLabel="Boy (cm)"
            />
            <p className={`mt-3 text-center text-sm text-amber-600 dark:text-amber-400 ${height.trim() && !heightValid ? '' : 'invisible'}`}>
              {HINT}
            </p>
          </Question>
        )}

        {step === 'activity' && (
          <Question title="Günlerin nasıl geçiyor?" hint="Aktivite düzeyin günlük enerji ihtiyacını belirler.">
            <div className="flex flex-col gap-2">
              {ACTIVITY_LEVELS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setActivity(a.key)}
                  className={`flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-left shadow-sm transition-all active:scale-[0.98] ${
                    activity === a.key ? selectedCard : idleCard
                  }`}
                >
                  <span>
                    <span className="block font-bold">{a.label}</span>
                    <span className="block text-sm text-soft">{a.description}</span>
                  </span>
                  {activity === a.key && (
                    <span className="animate-pop-in flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <IconCheck className="h-4 w-4" strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Question>
        )}

        {step === 'weight' && (
          <Question title="Şu anki kilon?" hint="İlk ölçümün olarak kaydedilir; BMI'ın hemen hazır olur. İstersen sonra da girebilirsin.">
            <NumberDial
              value={weight}
              onChange={setWeight}
              unit="kg"
              min={20}
              max={300}
              step={0.5}
              fallback={70}
              ariaLabel="Kilo (kg)"
            />
            <p className={`mt-3 text-center text-sm text-amber-600 dark:text-amber-400 ${weight.trim() && !weightValid ? '' : 'invisible'}`}>
              {HINT}
            </p>
          </Question>
        )}

        {step === 'done' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="animate-pop-in mb-5 text-7xl">{emoji}</span>
            <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
              Hazırsın, {name.trim()}!
              <IconSparkles className="h-7 w-7 text-amber-500" />
            </h1>
            <p className="mt-3 max-w-xs text-soft">
              Bilgilerinden BMI ve günlük enerji ihtiyacını kendiliğinden hesaplayacağız.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                `${age} yaş`,
                heightNum !== null ? `${formatDecimalTR(heightNum)} cm` : null,
                weightNum !== null && weightValid ? `${formatDecimalTR(weightNum)} kg` : null,
                activity ? ACTIVITY_LEVELS.find((a) => a.key === activity)?.label : null,
              ]
                .filter((c): c is string => c !== null)
                .map((c) => (
                  <span key={c} className="rounded-full bg-emerald-100 px-3.5 py-1.5 text-sm font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                    {c}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* CTA yapışkan: uzun adımlarda (aktivite, küçük ekran) buton hep görünür */}
        <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-canvas via-canvas to-transparent pt-7 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          {step === 'welcome' && <PrimaryButton onClick={() => go(1)}>Başlayalım</PrimaryButton>}

          {qIdx >= 0 && step !== 'weight' && (
            <PrimaryButton onClick={() => go(1)} disabled={!stepValid[step]}>
              Devam
            </PrimaryButton>
          )}

          {step === 'weight' && (
            <>
              <PrimaryButton onClick={() => go(1)} disabled={!stepValid.weight}>
                Devam
              </PrimaryButton>
              <button
                onClick={() => {
                  setWeight('')
                  go(1)
                }}
                className="mx-auto mt-3 block py-1 text-sm font-medium text-soft active:text-emerald-600"
              >
                Şimdilik geç
              </button>
            </>
          )}

          {step === 'done' && (
            <PrimaryButton onClick={() => void save()} disabled={saving}>
              Uygulamaya Geç 🎉
            </PrimaryButton>
          )}

          {step === 'welcome' && (
            <p className="mt-4 text-center text-xs text-faint">
              Verilerin yalnızca bu cihazda saklanır — hesap gerekmez.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
