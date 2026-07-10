import {
  ACTIVITY_LEVELS,
  SEXES,
  ageFromBirthDate,
  formatDecimalTR,
  parseDecimal,
  todayISO,
  type ActivityLevel,
  type Sex,
} from '@afiet/core'
import { router } from 'expo-router'
import { useState, type ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import Animated, { FadeInLeft, FadeInRight, ZoomIn } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { measurementRepo, profileRepo } from '@/data/repositories'
import { setActiveProfileId } from '@/features/profile/useActiveProfile'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconBowl, IconCheck, IconChevronRight, IconSparkles } from '@/ui/icons'
import { EmojiPicker } from '@/ui/inputs/EmojiPicker'
import { NumberDial } from '@/ui/inputs/NumberDial'
import { TextField } from '@/ui/inputs/TextField'
import { WheelDatePicker } from '@/ui/inputs/WheelPicker'

/* Onboarding — web features/onboarding/OnboardingPage.tsx portu: her ekranda
   tek soru. Profil burada oluşturulur, uygulamaya hazır girilir. Taslak düz
   React state'te yaşar (native'de sekme ölümü senaryosu yok — sessionStorage
   karşılığı gerekmez). */

const STEPS = ['welcome', 'name', 'emoji', 'sex', 'birth', 'height', 'activity', 'weight', 'done'] as const
type Step = (typeof STEPS)[number]

const QUESTIONS: Step[] = ['name', 'emoji', 'sex', 'birth', 'height', 'activity', 'weight']

const HINT = 'Bu değer biraz alışılmadık görünüyor — kontrol eder misin?'
const DEFAULT_BIRTH = '1995-06-15'

const selectedCard =
  'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/40'
const idleCard = 'border-line bg-surface'

function Question({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <>
      <AppText weight="extrabold" className="text-[26px] leading-9 text-ink">
        {title}
      </AppText>
      {hint && <AppText className="mt-2 text-soft">{hint}</AppText>}
      <View className="mt-7">{children}</View>
    </>
  )
}

function PrimaryButton({
  children,
  onPress,
  disabled,
}: {
  children: ReactNode
  onPress: () => void
  disabled?: boolean
}) {
  const [pressed, setPressed] = useState(false)
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className={`w-full items-center rounded-2xl bg-emerald-600 py-4 ${disabled ? 'opacity-40' : ''}`}
      style={pressed && !disabled ? { transform: [{ scale: 0.98 }] } : undefined}
    >
      <AppText weight="bold" className="text-lg text-white">
        {children}
      </AppText>
    </Pressable>
  )
}

/** Seçim kartlarındaki pop-in onay rozeti */
function CheckBadge() {
  return (
    <Animated.View entering={ZoomIn.duration(250)}>
      <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
        <IconCheck size={16} color="#ffffff" strokeWidth={3} />
      </View>
    </Animated.View>
  )
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']

  const [stepIdx, setStepIdx] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState<string | null>(null)
  const [sex, setSex] = useState<Sex | null>(null)
  const [birthDate, setBirthDate] = useState(DEFAULT_BIRTH)
  const [height, setHeight] = useState('')
  const [activity, setActivity] = useState<ActivityLevel | null>(null)
  const [weight, setWeight] = useState('')
  const [saving, setSaving] = useState(false)

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
    // Aktif profil sabitlenince (tabs) kapısı açılır; Bugün ekranına inilir
    setActiveProfileId(id)
    router.replace('/')
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        className="flex-1 px-5"
        style={{ paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {step !== 'welcome' && (
          <View className="mb-6 flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Geri"
              onPress={() => go(-1)}
              className="-ml-2 h-9 w-9 items-center justify-center rounded-full active:bg-muted"
            >
              <View style={{ transform: [{ rotate: '180deg' }] }}>
                <IconChevronRight size={20} color={t.faint} />
              </View>
            </Pressable>
            {qIdx >= 0 && (
              <>
                <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <View
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${((qIdx + 1) / QUESTIONS.length) * 100}%` }}
                  />
                </View>
                <AppText weight="semibold" className="w-8 text-right text-xs text-faint">
                  {qIdx + 1}/{QUESTIONS.length}
                </AppText>
              </>
            )}
          </View>
        )}

        <Animated.View
          key={step}
          entering={(dir === 1 ? FadeInRight : FadeInLeft).duration(300)}
          style={{ flex: 1 }}
        >
          {/* Çark adımında dış kaydırma kapalı — FlatList sütunlarıyla yarışmasın */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEnabled={step !== 'birth'}
          >
            {step === 'welcome' && (
              <View className="flex-1 items-center justify-center">
                <View className="mb-7 h-24 w-24 items-center justify-center overflow-hidden rounded-[32px]">
                  {/* NativeWind'de native gradient yok — marka degradesi SVG ile */}
                  <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
                    <Defs>
                      <LinearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#10b981" />
                        <Stop offset="1" stopColor="#2dd4bf" />
                      </LinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#hero)" />
                  </Svg>
                  <IconBowl size={48} color="#ffffff" strokeWidth={1.6} />
                </View>
                <AppText weight="extrabold" className="text-center text-3xl text-ink">
                  afiet&apos;e hoş geldin 🌱
                </AppText>
                <AppText className="mt-3 max-w-xs text-center text-soft">
                  Sayma, dengele: beslenmeni ve vücudunu yargısız, sade bir dille takip et. Önce
                  seni tanıyalım — bir dakikadan kısa sürer.
                </AppText>
              </View>
            )}

            {step === 'name' && (
              <Question title="Sana nasıl seslenelim?" hint="İsmin yalnızca bu cihazda saklanır.">
                <TextField
                  value={name}
                  onChangeText={setName}
                  placeholder="İsmin"
                  maxLength={20}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => stepValid.name && go(1)}
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
                <View className="flex-row gap-3">
                  {SEXES.map((s) => (
                    <Pressable
                      key={s.key}
                      accessibilityRole="button"
                      accessibilityState={{ selected: sex === s.key }}
                      onPress={() => setSex(s.key)}
                      className={`relative flex-1 items-center rounded-2xl border-2 py-7 ${
                        sex === s.key ? selectedCard : idleCard
                      }`}
                    >
                      <AppText weight="bold" className="text-lg text-ink">
                        {s.label}
                      </AppText>
                      {sex === s.key && (
                        <View className="absolute right-2.5 top-2.5">
                          <CheckBadge />
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              </Question>
            )}

            {step === 'birth' && (
              <Question title="Doğum tarihin?" hint="Yaşını enerji ihtiyacı hesabında kullanırız.">
                <WheelDatePicker value={birthDate} onChange={setBirthDate} maxDate={todayISO()} />
                <AppText
                  className={`mt-3 text-center text-sm ${
                    stepValid.birth ? 'text-soft' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {stepValid.birth ? `${age} yaşındasın` : HINT}
                </AppText>
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
                <AppText
                  className={`mt-3 text-center text-sm text-amber-600 dark:text-amber-400 ${
                    height.trim() && !heightValid ? '' : 'opacity-0'
                  }`}
                >
                  {HINT}
                </AppText>
              </Question>
            )}

            {step === 'activity' && (
              <Question title="Günlerin nasıl geçiyor?" hint="Aktivite düzeyin günlük enerji ihtiyacını belirler.">
                <View className="gap-2">
                  {ACTIVITY_LEVELS.map((a) => (
                    <Pressable
                      key={a.key}
                      accessibilityRole="button"
                      accessibilityState={{ selected: activity === a.key }}
                      onPress={() => setActivity(a.key)}
                      className={`flex-row items-center justify-between rounded-2xl border-2 px-4 py-3 ${
                        activity === a.key ? selectedCard : idleCard
                      }`}
                    >
                      <View className="flex-1 pr-2">
                        <AppText weight="bold" className="text-ink">
                          {a.label}
                        </AppText>
                        <AppText className="text-sm text-soft">{a.description}</AppText>
                      </View>
                      {activity === a.key && <CheckBadge />}
                    </Pressable>
                  ))}
                </View>
              </Question>
            )}

            {step === 'weight' && (
              <Question
                title="Şu anki kilon?"
                hint="İlk ölçümün olarak kaydedilir; BMI'ın hemen hazır olur. İstersen sonra da girebilirsin."
              >
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
                <AppText
                  className={`mt-3 text-center text-sm text-amber-600 dark:text-amber-400 ${
                    weight.trim() && !weightValid ? '' : 'opacity-0'
                  }`}
                >
                  {HINT}
                </AppText>
              </Question>
            )}

            {step === 'done' && (
              <View className="flex-1 items-center justify-center">
                <Animated.View entering={ZoomIn.duration(250)}>
                  <Text style={{ fontSize: 64, lineHeight: 80 }}>{emoji}</Text>
                </Animated.View>
                <View className="mt-5 flex-row items-center gap-2">
                  <AppText weight="extrabold" className="text-center text-3xl text-ink">
                    Hazırsın, {name.trim()}!
                  </AppText>
                  <IconSparkles size={28} color="#f59e0b" />
                </View>
                <AppText className="mt-3 max-w-xs text-center text-soft">
                  Bilgilerinden BMI ve günlük enerji ihtiyacını kendiliğinden hesaplayacağız.
                </AppText>
                <View className="mt-6 flex-row flex-wrap justify-center gap-2">
                  {[
                    `${age} yaş`,
                    heightNum !== null ? `${formatDecimalTR(heightNum)} cm` : null,
                    weightNum !== null && weightValid ? `${formatDecimalTR(weightNum)} kg` : null,
                    activity ? (ACTIVITY_LEVELS.find((a) => a.key === activity)?.label ?? null) : null,
                  ]
                    .filter((c): c is string => c !== null)
                    .map((c) => (
                      <View key={c} className="rounded-full bg-emerald-100 px-3.5 py-1.5 dark:bg-emerald-900/60">
                        <AppText weight="semibold" className="text-sm text-emerald-800 dark:text-emerald-200">
                          {c}
                        </AppText>
                      </View>
                    ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View className="pt-4">
            {step === 'welcome' && <PrimaryButton onPress={() => go(1)}>Başlayalım</PrimaryButton>}

            {qIdx >= 0 && step !== 'weight' && (
              <PrimaryButton onPress={() => go(1)} disabled={!stepValid[step]}>
                Devam
              </PrimaryButton>
            )}

            {step === 'weight' && (
              <>
                <PrimaryButton onPress={() => go(1)} disabled={!stepValid.weight}>
                  Devam
                </PrimaryButton>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setWeight('')
                    go(1)
                  }}
                  className="mt-3 self-center py-1"
                >
                  <AppText weight="semibold" className="text-sm text-soft">
                    Şimdilik geç
                  </AppText>
                </Pressable>
              </>
            )}

            {step === 'done' && (
              <PrimaryButton onPress={() => void save()} disabled={saving}>
                Uygulamaya Geç 🎉
              </PrimaryButton>
            )}

            {step === 'welcome' && (
              <AppText className="mt-4 text-center text-xs text-faint">
                Verilerin yalnızca bu cihazda saklanır — hesap gerekmez.
              </AppText>
            )}
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  )
}
