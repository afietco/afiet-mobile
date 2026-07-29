import {
  ACTIVITY_LEVELS,
  GOAL_DIRECTIONS,
  SEXES,
  SPORT_ACTIVITIES,
  ageFromBirthDate,
  parseDecimal,
  todayISO,
  type ActivityLevel,
  type GoalDirection,
  type Profile,
  type Sex,
  type SportActivity,
} from '@afiet/core'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native'
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated'
import { profileRepo } from '../../data/repositories'
import { directionStartsOnNote } from '@/features/goals/DirectionSheet'
import { useGoalDirection } from '@/features/goals/useGoalDirection'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconSparkles } from '@/ui/icons'
import { WheelDatePicker } from '@/ui/inputs/WheelPicker'
import { AfiPose } from '@/ui/maskot'
import { Sheet } from '@/ui/Sheet'

/* Body setup presents one profile question at a time. */

const HINT = 'Bu değer biraz alışılmadık görünüyor; kontrol eder misin?'
const DIRECTION_ERROR = 'Yönünü kaydedemedik. Bir kez daha dener misin?'
const DEFAULT_BIRTH = '1995-06-15'
/**
 * The goal direction is asked here, right after the activity level, so a
 * direction exists from day one instead of being taught later on Today
 * (docs/hedeflerim.md section 8 decided the opposite; the product owner
 * reversed it on 27 Jul 2026 and that section is now stale).
 */
const DIRECTION_STEP = 4
const LAST_STEP = 6

/**
 * One step, as tall as it needs to be and no taller than it is allowed.
 *
 * Every step carries its own height, so a short one sits directly above the
 * buttons and cannot leave a hole. The ceiling comes from the caller and the
 * body scrolls against it, so the longest step (sixteen sports) stays inside
 * its own area instead of pushing Devam off the bottom edge.
 */
function StepBody({ children }: { children: ReactNode }) {
  return (
    <Animated.View entering={FadeInRight.duration(220)} exiting={FadeOutLeft.duration(160)}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        {children}
      </ScrollView>
    </Animated.View>
  )
}

interface BodySetupSheetProps {
  profile: Profile
  open: boolean
  onClose: () => void
  onSaved?: () => void
}

export function BodySetupSheet({
  profile,
  open,
  onClose,
  onSaved,
}: BodySetupSheetProps) {
  const { isDark } = useTheme()
  const { height: windowHeight } = useWindowDimensions()
  const t = tokens[isDark ? 'dark' : 'light']
  const [step, setStep] = useState(0)
  const [sex, setSex] = useState<Sex | null>(null)
  const [birthDate, setBirthDate] = useState('')
  const [height, setHeight] = useState('')
  const [activity, setActivity] = useState<ActivityLevel | null>(null)
  const [direction, setDirection] = useState<GoalDirection | null>(null)
  const [doesSport, setDoesSport] = useState<boolean | null>(null)
  const [sports, setSports] = useState<SportActivity[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const savingRef = useRef(false)
  const today = todayISO()
  const {
    direction: activeDirection,
    isDefault: directionUnchosen,
    pending: pendingDirection,
    startsOn: directionStartsOn,
    choose: chooseDirection,
  } = useGoalDirection(today)

  useEffect(() => {
    if (!open) return
    const savedSports = profile.sports ?? []
    setStep(0)
    setSex(profile.sex ?? null)
    setBirthDate(profile.birthDate ?? DEFAULT_BIRTH)
    setHeight(profile.heightCm != null ? String(profile.heightCm).replace('.', ',') : '')
    setActivity(profile.activityLevel ?? null)
    setDirection(null)
    setSports(savedSports)
    setDoesSport(profile.sports === undefined ? null : savedSports.length > 0)
    setSaveError(null)
  }, [open, profile])

  const heightNum = parseDecimal(height)
  const heightValid = heightNum !== null && heightNum >= 100 && heightNum <= 250
  const age = birthDate ? ageFromBirthDate(birthDate) : null
  const birthValid = age !== null && age >= 5 && age <= 120
  const totalSteps = doesSport === false ? 6 : 7

  /* What the direction step shows as chosen: this session's pick first, then a
     choice already queued for its Monday, then the one in force. The silent
     `duzen` default is never marked, because nobody chose it. */
  const shownDirection =
    direction ?? pendingDirection?.direction ?? (directionUnchosen ? null : activeDirection)
  const directionNote = directionStartsOnNote(directionStartsOn, today)

  const stepValid =
    (step === 0 && sex !== null) ||
    (step === 1 && birthValid) ||
    (step === 2 && heightValid) ||
    (step === 3 && activity !== null) ||
    (step === DIRECTION_STEP && shownDirection !== null) ||
    (step === 5 && doesSport !== null) ||
    (step === LAST_STEP && sports.length > 0)

  const save = async (selectedSports: SportActivity[]) => {
    if (
      !profile.id ||
      !sex ||
      !birthValid ||
      !heightValid ||
      !activity ||
      savingRef.current
    ) {
      return
    }
    savingRef.current = true
    setSaving(true)
    setSaveError(null)
    try {
      await profileRepo.updateBody(profile.id, {
        sex,
        birthDate,
        heightCm: heightNum!,
        activityLevel: activity,
        sports: selectedSports,
      })
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onSaved?.()
      onClose()
    } catch {
      setSaveError('Bilgilerini kaydedemedik. Bağlantını kontrol edip tekrar dene.')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const advance = () => {
    if (!stepValid || saving) return
    setSaveError(null)
    if (step === 5 && doesSport === false) {
      void save([])
      return
    }
    if (step === LAST_STEP) {
      void save(sports)
      return
    }
    setStep((current) => current + 1)
    void Haptics.selectionAsync()
  }

  /**
   * Choosing a direction is the whole answer, so the tap stores it and the step
   * moves on: there is nothing left to confirm. Re-picking the direction that
   * is already in force stores nothing, because there is no change to date.
   */
  const pickDirection = async (next: GoalDirection) => {
    if (saving) return
    void Haptics.selectionAsync()
    setSaveError(null)
    if (next === shownDirection) {
      setStep(DIRECTION_STEP + 1)
      return
    }
    try {
      await chooseDirection(next)
      setDirection(next)
      setStep(DIRECTION_STEP + 1)
    } catch {
      setSaveError(DIRECTION_ERROR)
    }
  }

  const goBack = () => {
    if (step === 0 || saving) return
    setSaveError(null)
    setStep((current) => current - 1)
  }

  const toggleSport = (sport: SportActivity) => {
    setSports((current) =>
      current.includes(sport) ? current.filter((item) => item !== sport) : [...current, sport],
    )
  }

  const selectedRow =
    'border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/50'
  const idleRow = 'border-line bg-surface'
  const finalStep = step === LAST_STEP || (step === 5 && doesSport === false)

  return (
    <Sheet
      open={open}
      onClose={() => {
        if (!saving) onClose()
      }}
      contentPanning={false}
      /* Nearly the whole screen, over the tab bar. The flow is seven steps of
         cards and the bar underneath was both a distraction and the reason the
         last option kept colliding with the buttons. */
      heightRatio={0.97}
      overTabBar
      /* The guide used to hold this sheet shut so nobody wandered off half way
         through. A sheet that cannot be closed is a trap the moment anything
         inside it goes wrong, and the guide re-offers itself anyway, so only a
         save in flight keeps it open now. */
      enablePanDownToClose={!saving}
      scrollable={false}
      title={
        <>
          <IconSparkles size={22} color={isDark ? '#a78bfa' : '#7c3aed'} />
          <AppText weight="bold" className="text-lg text-ink">
            Seni tanıyalım
          </AppText>
        </>
      }
    >
      <View className="mb-4 flex-row items-center">
        <AfiPose pose="merak" size={64} />
        <View className="ml-2 flex-1">
          <AppText weight="bold" className="text-violet-700 dark:text-violet-300">
            {step + 1}/{totalSteps}
          </AppText>
          <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950">
            <View
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </View>
        </View>
      </View>

      {/* The step box owns everything between the progress row and the buttons.

          A ceiling, not a height: it is the one thing here that cannot be
          asked of the sheet. gorhom lays its content view out absolutely with
          no bottom edge, so nothing inside can claim "the space that is left"
          without collapsing to nothing, and pinning that edge instead reaches
          into the sheet's overdrag padding and pushes the buttons off screen.
          Half the window is a bound every phone can honour: short steps take
          the height they need and the longest one scrolls against it. */}
      <View className="overflow-hidden" style={{ maxHeight: Math.round(windowHeight * 0.5) }}>
        <StepBody key={step}>
          {step === 0 ? (
            <>
              <AppText weight="bold" className="mb-2 text-2xl text-ink">
                Cinsiyetin nedir?
              </AppText>
              <AppText className="mb-6 text-sm text-soft">
                Vücut hesaplarını doğru kişiselleştirmek için kullanacağız.
              </AppText>
              <View className="flex-row gap-3">
                {SEXES.map((item) => (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sex === item.key }}
                    onPress={() => setSex(item.key)}
                    className={`flex-1 items-center rounded-2xl border py-5 ${
                      sex === item.key ? selectedRow : idleRow
                    }`}
                  >
                    <AppText weight="bold" className="text-base text-ink">
                      {item.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <AppText weight="bold" className="mb-2 text-2xl text-ink">
                Doğum tarihin nedir?
              </AppText>
              <AppText className="mb-4 text-sm text-soft">
                Yaşına uygun günlük enerji ihtiyacını hesaplayacağız.
              </AppText>
              <WheelDatePicker
                value={birthDate || DEFAULT_BIRTH}
                onChange={setBirthDate}
                maxDate={todayISO()}
                accent="violet"
              />
              {birthDate && !birthValid ? (
                <AppText className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  {HINT}
                </AppText>
              ) : null}
            </>
          ) : null}

          {step === 2 ? (
            <>
              <AppText weight="bold" className="mb-2 text-2xl text-ink">
                Boyun kaç santimetre?
              </AppText>
              <AppText className="mb-5 text-sm text-soft">
                BMI ve günlük enerji hesabında kullanacağız.
              </AppText>
              <BottomSheetTextInput
                autoFocus
                keyboardType="decimal-pad"
                value={height}
                onChangeText={setHeight}
                placeholder="örn. 168"
                placeholderTextColor={t.faint}
                style={{
                  borderWidth: 1,
                  borderColor: height.trim() && !heightValid ? '#d97706' : t.line,
                  borderRadius: 16,
                  paddingHorizontal: 18,
                  paddingVertical: 16,
                  fontFamily: 'Nunito_700Bold',
                  fontSize: 20,
                  color: t.ink,
                }}
              />
              {height.trim() && !heightValid ? (
                <AppText className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  {HINT}
                </AppText>
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <AppText weight="bold" className="mb-2 text-2xl text-ink">
                Günün genelde nasıl geçiyor?
              </AppText>
              <AppText className="mb-4 text-sm text-soft">
                Sporundan bağımsız, günlük hareket düzenini düşün.
              </AppText>
              <View className="gap-2">
                {ACTIVITY_LEVELS.map((item) => (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activity === item.key }}
                    onPress={() => setActivity(item.key)}
                    className={`rounded-xl border px-4 py-2.5 ${
                      activity === item.key ? selectedRow : idleRow
                    }`}
                  >
                    <AppText weight="semibold" className="text-sm text-ink">
                      {item.label}
                    </AppText>
                    <AppText className="text-xs text-soft">{item.description}</AppText>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          {/* The goal direction, asked in the same voice as the questions around
              it: the engine's five sentences, one tap, and the week said once in
              the quietest line on the step (docs/hedeflerim.md sections 3 and 7). */}
          {step === DIRECTION_STEP ? (
            <>
              <AppText weight="bold" className="mb-2 text-2xl text-ink">
                Ölçülerini neye göre kurayım?
              </AppText>
              <AppText className="mb-4 text-sm text-soft">
                Sana en yakın gelene dokun, gerisini ben kurarım.
              </AppText>
              <View className="gap-2">
                {GOAL_DIRECTIONS.map((item) => (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: shownDirection === item.key, disabled: saving }}
                    disabled={saving}
                    onPress={() => {
                      void pickDirection(item.key)
                    }}
                    className={`rounded-xl border px-4 py-2.5 ${
                      shownDirection === item.key ? selectedRow : idleRow
                    }`}
                  >
                    <AppText weight="semibold" className="text-sm text-ink">
                      {item.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
              {directionNote ? (
                <AppText className="mt-3 text-xs leading-4 text-faint">{directionNote}</AppText>
              ) : null}
            </>
          ) : null}

          {step === 5 ? (
            <>
              <AppText weight="bold" className="mb-2 text-2xl text-ink">
                Düzenli yaptığın bir spor var mı?
              </AppText>
              <AppText className="mb-6 text-sm text-soft">
                Varsa bir sonraki adımda hangileri olduğunu seçebilirsin.
              </AppText>
              <View className="flex-row gap-3">
                {[
                  { value: true, label: 'Evet, var' },
                  { value: false, label: 'Hayır' },
                ].map((item) => (
                  <Pressable
                    key={String(item.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: doesSport === item.value }}
                    onPress={() => {
                      setDoesSport(item.value)
                      if (!item.value) setSports([])
                    }}
                    className={`flex-1 items-center rounded-2xl border py-5 ${
                      doesSport === item.value ? selectedRow : idleRow
                    }`}
                  >
                    <AppText weight="bold" className="text-base text-ink">
                      {item.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          {step === LAST_STEP ? (
            <>
              <AppText weight="bold" className="mb-2 text-2xl text-ink">
                Hangi sporları yapıyorsun?
              </AppText>
              <AppText className="mb-4 text-sm text-soft">Birden fazla seçebilirsin.</AppText>
              <View className="flex-row flex-wrap justify-between gap-y-2">
                {SPORT_ACTIVITIES.map((item) => (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sports.includes(item.key) }}
                    onPress={() => toggleSport(item.key)}
                    className={`flex-row items-center rounded-xl border px-3 py-3 ${
                      sports.includes(item.key) ? selectedRow : idleRow
                    }`}
                    style={{ width: '48.5%' }}
                  >
                    <AppText className="mr-2 text-lg">{item.emoji}</AppText>
                    <AppText weight="semibold" className="flex-1 text-sm text-ink">
                      {item.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </StepBody>
      </View>

      {saveError ? (
        <AppText selectable className="mb-3 text-center text-sm text-red-600 dark:text-red-400">
          {saveError}
        </AppText>
      ) : null}

      <View className="flex-row gap-3">
        {step > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={goBack}
            disabled={saving}
            className="items-center rounded-xl border border-line bg-surface px-6 py-3.5"
          >
            <AppText weight="semibold" className="text-soft">
              Geri
            </AppText>
          </Pressable>
        ) : null}
        {/* The direction step has no forward button: the tap on a sentence is
            the answer and the step moves on by itself, so a Devam here would be
            a confirmation of something already decided. */}
        {step === DIRECTION_STEP ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !stepValid || saving, busy: saving }}
            onPress={advance}
            disabled={!stepValid || saving}
            className={`flex-1 items-center rounded-xl bg-violet-600 py-3.5 ${
              !stepValid || saving ? 'opacity-40' : ''
            }`}
          >
            <AppText weight="semibold" className="text-white">
              {saving ? 'Kaydediliyor…' : finalStep ? 'Kaydet' : 'Devam'}
            </AppText>
          </Pressable>
        )}
      </View>
    </Sheet>
  )
}
