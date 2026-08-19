import {
  formatNumber,
  formatShortTR,
  parseDecimal,
  todayISO,
  type Measurement,
  type Sex,
} from '@afiet/core'
import { BottomSheetTextInput, type BottomSheetScrollViewMethods } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import { Pressable, View, type LayoutChangeEvent, type TextStyle } from 'react-native'
import { measurementRepo } from '../../data/repositories'
import { track } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconCalendar, IconRuler } from '@/ui/icons'
import { WheelDatePicker } from '@/ui/inputs/WheelPicker'
import { AfiPose } from '@/ui/maskot'
import { Sheet } from '@/ui/Sheet'
import { FormProblemNote, useFormGate, type FormProblem } from '@/ui/formGate'
import { fontFamilies } from '@/theme/fonts'

/* Measurement entry requires weight; body-tape measurements are optional. */

const HINT = 'Bu değer biraz alışılmadık görünüyor; kontrol eder misin?'

interface MeasurementSheetProps {
  profileId: number
  sex?: Sex
  /** Placeholder için son ölçüm */
  latest?: Measurement
  open: boolean
  onClose: () => void
  onSaved?: () => void
  guideMode?: boolean
}

export function MeasurementSheet({
  profileId,
  sex,
  latest,
  open,
  onClose,
  onSaved,
  guideMode = false,
}: MeasurementSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [neck, setNeck] = useState('')
  const [hip, setHip] = useState('')
  const [date, setDate] = useState(todayISO())
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const gate = useFormGate()
  const savingRef = useRef(false)
  const scrollRef = useRef<BottomSheetScrollViewMethods>(null)
  /** Where the weight block sits in the scroll content, so it can be shown. */
  const weightY = useRef(0)
  /** Whether this opening has already been given its starting values. */
  const seeded = useRef(false)

  /* Opened with the last weight already in the field, not behind it.
     The empty field used to carry that weight as its placeholder, and a grey
     number in a box reads as a filled box: App Review saw one, filled the
     tape fields underneath, and met a Kaydet that could not be pressed and
     said nothing about why. A real value can be typed over. A ghost cannot.
     Seeded once per opening, so a late-arriving `latest` never overwrites
     what the person is in the middle of typing. */
  useEffect(() => {
    if (!open) {
      seeded.current = false
      return
    }
    if (seeded.current) return
    seeded.current = true
    setWeight(latest ? formatNumber(latest.weightKg) : '')
    setWaist('')
    setNeck('')
    setHip('')
    setDate(todayISO())
    setDatePickerOpen(false)
    setSaveError(null)
    gate.clear()
  }, [open, latest, gate])

  const weightNum = parseDecimal(weight)
  const weightValid = weightNum !== null && weightNum >= 20 && weightNum <= 300

  const girth = (s: string) => {
    if (s.trim() === '') return { value: undefined, valid: true }
    const n = parseDecimal(s)
    return { value: n ?? undefined, valid: n !== null && n >= 20 && n <= 250 }
  }
  const w = girth(waist)
  const n = girth(neck)
  const asksForHip = sex === 'kadin'
  const h = asksForHip ? girth(hip) : { value: undefined, valid: true }

  /** The first thing standing between this sheet and a saved measurement. */
  const firstProblem = (): FormProblem | null => {
    if (weight.trim() === '')
      return { message: 'Kaydedebilmem için kilonu yazman yeterli.', field: 'weight' }
    if (!weightValid) return { message: 'Kiloyu 20 ile 300 kg arasında yaz.', field: 'weight' }
    if (!w.valid || !n.valid || !h.valid)
      return { message: 'Mezura ölçüleri 20 ile 250 cm arasında olmalı.', field: 'other' }
    if (date === '') return { message: 'Bir gün seçmen gerekiyor.', field: 'other' }
    return null
  }

  /** Drops the standing complaint the moment the person acts on it. */
  const edit = (set: (value: string) => void) => (value: string) => {
    set(value)
    gate.clear()
  }

  /* A press is never refused in silence: either the save runs or the sheet
     says what it is waiting on and carries the person to it. */
  const press = () => {
    if (savingRef.current) return
    const problem = gate.attempt(firstProblem, () => void save())
    if (problem?.field === 'weight')
      scrollRef.current?.scrollTo({ y: Math.max(0, weightY.current - 12), animated: true })
  }

  const save = async () => {
    savingRef.current = true
    setSaving(true)
    setSaveError(null)
    try {
      await measurementRepo.upsertForDay(profileId, date, {
        weightKg: weightNum!,
        waistCm: w.value,
        neckCm: n.value,
        hipCm: asksForHip ? h.value : undefined,
      })
      track('measurement_added')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onSaved?.()
      onClose()
    } catch {
      setSaveError('Ölçümü kaydedemedik. Bağlantını kontrol edip tekrar dene.')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const inputStyle: TextStyle = {
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: fontFamilies.normal,
    fontSize: 16,
    color: t.ink,
  }
  const weightStyle: TextStyle =
    gate.problem?.field === 'weight'
      ? { ...inputStyle, borderColor: isDark ? '#fbbf24' : '#d97706' }
      : inputStyle
  const invalid = (filled: boolean, valid: boolean) => filled && !valid

  return (
    <Sheet
      name="measurement"
      open={open}
      onClose={() => {
        if (!saving) onClose()
      }}
      contentPanning={false}
      scrollRef={scrollRef}
      /* The guide used to hold this sheet shut so nobody wandered off half way
         through. A sheet that cannot be closed is a trap the moment anything
         inside it goes wrong, and the guide re-offers itself anyway, so only a
         save in flight keeps it open now. */
      enablePanDownToClose={!saving}
      title={
        <>
          <IconRuler size={22} color={isDark ? '#a78bfa' : '#7c3aed'} />
          <AppText weight="bold" className="text-lg text-ink">
            Ölçüm Ekle
          </AppText>
        </>
      }
    >
      {guideMode ? (
        <View className="mb-4 flex-row items-center gap-3 rounded-2xl bg-violet-50 p-3 dark:bg-violet-950/50">
          <AfiPose pose="merak" size={72} />
          <View className="flex-1">
            <AppText weight="bold" className="text-violet-800 dark:text-violet-200">
              Son adımdayız
            </AppText>
            <AppText className="mt-1 text-sm text-violet-700 dark:text-violet-300">
              Kilonu yazman yeterli; mezura alanları isteğe bağlı. Kaydettiğinde Bugün’e
              birlikte döneceğiz.
            </AppText>
          </View>
        </View>
      ) : null}
      <View
        onLayout={(event: LayoutChangeEvent) => {
          weightY.current = event.nativeEvent.layout.y
        }}
      >
        <AppText weight="semibold" className="mb-2 text-sm text-soft">
          Kilo (kg)
        </AppText>
        <BottomSheetTextInput
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={edit(setWeight)}
          placeholder="örn. 72,5"
          placeholderTextColor={t.faint}
          style={weightStyle}
        />
        <AppText
          className={`mt-1 text-xs text-amber-600 dark:text-amber-400 ${
            gate.problem?.field === 'weight' || invalid(weight.trim() !== '', weightValid)
              ? ''
              : 'opacity-0'
          }`}
        >
          {gate.problem?.field === 'weight' ? gate.problem.message : HINT}
        </AppText>
      </View>

      <AppText weight="semibold" className="mb-1 py-2 text-sm text-soft">
        Mezura ölçüleri (isteğe bağlı)
      </AppText>

      <View className="mb-2">
        <AppText className="mb-3 text-xs text-faint">
          {asksForHip
            ? 'Bel, boyun ve kalça ölçülerinle vücut yağ oranını hesaplayabiliriz.'
            : 'Bel ve boyun ölçülerinle vücut yağ oranını hesaplayabiliriz.'}
        </AppText>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <AppText weight="semibold" className="mb-1.5 text-sm text-soft">
              Bel (cm)
            </AppText>
            <BottomSheetTextInput keyboardType="decimal-pad" value={waist} onChangeText={edit(setWaist)} style={inputStyle} />
          </View>
          <View className="flex-1">
            <AppText weight="semibold" className="mb-1.5 text-sm text-soft">
              Boyun (cm)
            </AppText>
            <BottomSheetTextInput keyboardType="decimal-pad" value={neck} onChangeText={edit(setNeck)} style={inputStyle} />
          </View>
          {asksForHip ? (
            <View className="flex-1">
              <AppText weight="semibold" className="mb-1.5 text-sm text-soft">
                Kalça (cm)
              </AppText>
              <BottomSheetTextInput
                keyboardType="decimal-pad"
                value={hip}
                onChangeText={edit(setHip)}
                style={inputStyle}
              />
            </View>
          ) : null}
        </View>
        <AppText
          className={`mt-1 text-xs text-amber-600 dark:text-amber-400 ${
            invalid(waist.trim() !== '', w.valid) ||
            invalid(neck.trim() !== '', n.valid) ||
            (asksForHip && invalid(hip.trim() !== '', h.valid))
              ? ''
              : 'opacity-0'
          }`}
        >
          {HINT}
        </AppText>
      </View>

      <View className="mb-5">
        <Pressable
          accessibilityRole="button"
          onPress={() => setDatePickerOpen((v) => !v)}
          className="flex-row items-center gap-2 self-start rounded-xl border border-line bg-surface px-3 py-2"
        >
          <IconCalendar size={18} color={isDark ? '#a78bfa' : '#7c3aed'} />
          <AppText weight="semibold" className="text-sm text-soft">
            {date === todayISO() ? 'Bugün' : formatShortTR(date)}
          </AppText>
        </Pressable>
        {datePickerOpen && (
          <View className="mt-2">
            <WheelDatePicker
              value={date}
              onChange={setDate}
              minYear={new Date().getFullYear() - 2}
              maxDate={todayISO()}
              accent="violet"
            />
          </View>
        )}
      </View>

      {gate.problem?.field === 'other' ? (
        <FormProblemNote problem={gate.problem} />
      ) : null}

      {saveError ? (
        <AppText selectable className="mb-3 text-center text-sm text-soft">
          {saveError}
        </AppText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: saving }}
        onPress={press}
        disabled={saving}
        className={`w-full items-center rounded-xl bg-violet-600 py-3.5 ${saving ? 'opacity-40' : ''}`}
      >
        <AppText weight="semibold" className="text-white">
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </AppText>
      </Pressable>
    </Sheet>
  )
}
