import {
  ACTIVITY_LEVELS,
  SEXES,
  ageFromBirthDate,
  parseDecimal,
  todayISO,
  type ActivityLevel,
  type Profile,
  type Sex,
} from '@afiet/core'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { profileRepo } from '../../data/repositories'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconSparkles } from '@/ui/icons'
import { WheelDatePicker } from '@/ui/inputs/WheelPicker'
import { Sheet } from '@/ui/Sheet'

/* Web BodySetupSheet.tsx portu — cinsiyet, doğum tarihi, boy, aktivite */

const HINT = 'Bu değer biraz alışılmadık görünüyor — kontrol eder misin?'
const DEFAULT_BIRTH = '1995-06-15'

interface BodySetupSheetProps {
  profile: Profile
  open: boolean
  onClose: () => void
}

export function BodySetupSheet({ profile, open, onClose }: BodySetupSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
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
      contentPanning={false}
      title={
        <>
          <IconSparkles size={22} color={isDark ? '#a78bfa' : '#7c3aed'} />
          <AppText weight="bold" className="text-lg text-ink">
            Seni tanıyalım
          </AppText>
        </>
      }
    >
      <AppText className="mb-4 text-sm text-soft">
        Bu bilgilerle BMI ve günlük enerji ihtiyacını kendiliğinden hesaplarız. Hesabında
        saklanır.
      </AppText>

      <AppText weight="semibold" className="mb-2 text-sm text-soft">
        Cinsiyet
      </AppText>
      <View className="mb-4 flex-row gap-2">
        {SEXES.map((s) => (
          <Pressable
            key={s.key}
            accessibilityRole="button"
            accessibilityState={{ selected: sex === s.key }}
            onPress={() => setSex(s.key)}
            className={`flex-1 items-center rounded-xl border py-2.5 ${
              sex === s.key ? selectedRow : idleRow
            }`}
          >
            <AppText weight="semibold" className="text-sm text-ink">
              {s.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      <AppText weight="semibold" className="mb-2 text-sm text-soft">
        Doğum tarihi
      </AppText>
      <WheelDatePicker value={birthDate || DEFAULT_BIRTH} onChange={setBirthDate} maxDate={todayISO()} accent="violet" />
      <AppText
        className={`mb-3 mt-1 text-xs text-amber-600 dark:text-amber-400 ${
          birthDate && !birthValid ? '' : 'opacity-0'
        }`}
      >
        {HINT}
      </AppText>

      <AppText weight="semibold" className="mb-2 text-sm text-soft">
        Boy (cm)
      </AppText>
      <BottomSheetTextInput
        keyboardType="decimal-pad"
        value={height}
        onChangeText={setHeight}
        placeholder="örn. 168"
        placeholderTextColor={t.faint}
        style={{
          borderWidth: 1,
          borderColor: t.line,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontFamily: 'Nunito_400Regular',
          fontSize: 16,
          color: t.ink,
          marginBottom: 4,
        }}
      />
      <AppText
        className={`mb-3 text-xs text-amber-600 dark:text-amber-400 ${
          height.trim() && !heightValid ? '' : 'opacity-0'
        }`}
      >
        {HINT}
      </AppText>

      <AppText weight="semibold" className="mb-2 text-sm text-soft">
        Aktivite düzeyi
      </AppText>
      <View className="mb-6 gap-2">
        {ACTIVITY_LEVELS.map((a) => (
          <Pressable
            key={a.key}
            accessibilityRole="button"
            accessibilityState={{ selected: activity === a.key }}
            onPress={() => setActivity(a.key)}
            className={`rounded-xl border px-4 py-2.5 ${activity === a.key ? selectedRow : idleRow}`}
          >
            <AppText weight="semibold" className="text-sm text-ink">
              {a.label}
            </AppText>
            <AppText className="text-xs text-soft">{a.description}</AppText>
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => void save()}
        disabled={!canSave}
        className={`w-full items-center rounded-xl bg-violet-600 py-3.5 ${!canSave ? 'opacity-40' : ''}`}
      >
        <AppText weight="semibold" className="text-white">
          Kaydet
        </AppText>
      </Pressable>
    </Sheet>
  )
}
