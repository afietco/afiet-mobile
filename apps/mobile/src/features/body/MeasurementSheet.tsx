import {
  formatNumber,
  formatShortTR,
  parseDecimal,
  todayISO,
  type Measurement,
  type Sex,
} from '@afiet/core'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import { Pressable, View, type TextStyle } from 'react-native'
import { measurementRepo } from '../../data/repositories'
import { track } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconCalendar, IconRuler } from '@/ui/icons'
import { WheelDatePicker } from '@/ui/inputs/WheelPicker'
import { Sheet } from '@/ui/Sheet'

/* Measurement entry requires weight; body-tape measurements are optional. */

const HINT = 'Bu değer biraz alışılmadık görünüyor; kontrol eder misin?'

interface MeasurementSheetProps {
  profileId: number
  sex?: Sex
  /** Placeholder için son ölçüm */
  latest?: Measurement
  open: boolean
  onClose: () => void
}

export function MeasurementSheet({ profileId, sex, latest, open, onClose }: MeasurementSheetProps) {
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
  const savingRef = useRef(false)

  useEffect(() => {
    if (!open) return
    setWeight('')
    setWaist('')
    setNeck('')
    setHip('')
    setDate(todayISO())
    setDatePickerOpen(false)
    setSaveError(null)
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
    if (!canSave || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setSaveError(null)
    try {
      await measurementRepo.upsertForDay(profileId, date, {
        weightKg: weightNum!,
        waistCm: w.value,
        neckCm: n.value,
        hipCm: h.value,
      })
      track('measurement_added')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
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
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: t.ink,
  }
  const invalid = (filled: boolean, valid: boolean) => filled && !valid

  return (
    <Sheet
      open={open}
      onClose={() => {
        if (!saving) onClose()
      }}
      contentPanning={false}
      title={
        <>
          <IconRuler size={22} color={isDark ? '#a78bfa' : '#7c3aed'} />
          <AppText weight="bold" className="text-lg text-ink">
            Ölçüm Ekle
          </AppText>
        </>
      }
    >
      <AppText weight="semibold" className="mb-2 text-sm text-soft">
        Kilo (kg)
      </AppText>
      <BottomSheetTextInput
        keyboardType="decimal-pad"
        value={weight}
        onChangeText={setWeight}
        placeholder={latest ? formatNumber(latest.weightKg) : 'örn. 72,5'}
        placeholderTextColor={t.faint}
        style={inputStyle}
      />
      <AppText
        className={`mt-1 text-xs text-amber-600 dark:text-amber-400 ${
          invalid(weight.trim() !== '', weightValid) ? '' : 'opacity-0'
        }`}
      >
        {HINT}
      </AppText>

      <AppText weight="semibold" className="mb-1 py-2 text-sm text-soft">
        Mezura ölçüleri (isteğe bağlı)
      </AppText>

      <View className="mb-2">
        <AppText className="mb-3 text-xs text-faint">
          Bel + boyun (kadınlarda kalça da) ile vücut yağ oranını hesaplayabiliriz.
        </AppText>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <AppText weight="semibold" className="mb-1.5 text-sm text-soft">
              Bel (cm)
            </AppText>
            <BottomSheetTextInput keyboardType="decimal-pad" value={waist} onChangeText={setWaist} style={inputStyle} />
          </View>
          <View className="flex-1">
            <AppText weight="semibold" className="mb-1.5 text-sm text-soft">
              Boyun (cm)
            </AppText>
            <BottomSheetTextInput keyboardType="decimal-pad" value={neck} onChangeText={setNeck} style={inputStyle} />
          </View>
          <View className="flex-1">
            <AppText weight="semibold" className="mb-1.5 text-sm text-soft">
              Kalça (cm)
            </AppText>
            <BottomSheetTextInput keyboardType="decimal-pad" value={hip} onChangeText={setHip} style={inputStyle} />
          </View>
        </View>
        <AppText
          className={`mt-1 text-xs text-amber-600 dark:text-amber-400 ${
            invalid(waist.trim() !== '', w.valid) ||
            invalid(neck.trim() !== '', n.valid) ||
            invalid(hip.trim() !== '', h.valid)
              ? ''
              : 'opacity-0'
          }`}
        >
          {HINT}
        </AppText>
        {sex === 'erkek' && (
          <AppText className="mt-1 text-xs text-faint">
            Erkeklerde kalça ölçüsü hesapta kullanılmaz, yine de kaydedebilirsin.
          </AppText>
        )}
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

      {saveError ? (
        <AppText selectable className="mb-3 text-center text-sm text-soft">
          {saveError}
        </AppText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave || saving, busy: saving }}
        onPress={() => void save()}
        disabled={!canSave || saving}
        className={`w-full items-center rounded-xl bg-violet-600 py-3.5 ${!canSave || saving ? 'opacity-40' : ''}`}
      >
        <AppText weight="semibold" className="text-white">
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </AppText>
      </Pressable>
    </Sheet>
  )
}
