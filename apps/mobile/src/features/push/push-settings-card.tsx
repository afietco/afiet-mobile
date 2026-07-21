import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, Linking, Platform, Pressable, Switch, View } from 'react-native'
import type { ApiPushPreferences, ApiPushPreferencesPatch } from '@/data/api/client'
import { useAuth } from '@/features/auth/AuthContext'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconBell } from '@/ui/icons'
import {
  getPushPermissionState,
  requestPushPermission,
  syncCurrentPushDevice,
  type PushPermissionState,
} from './push-notifications'

function timeDate(value: string): Date {
  const [hours, minutes] = value.split(':').map(Number)
  const date = new Date()
  date.setHours(hours || 0, minutes || 0, 0, 0)
  return date
}

function formatTime(value: Date): string {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
}

function permissionLabel(state: PushPermissionState): string {
  switch (state) {
    case 'granted':
      return 'Sistem izni açık'
    case 'denied':
      return 'Sistem izni kapalı'
    case 'undetermined':
      return 'Henüz izin vermedin'
    default:
      return 'Bu cihazda kullanılamıyor'
  }
}

export function PushSettingsCard() {
  const { api } = useAuth()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const emerald = isDark ? '#34d399' : '#059669'
  const [preferences, setPreferences] = useState<ApiPushPreferences | null>(null)
  const [permission, setPermission] = useState<PushPermissionState>('unavailable')
  const [busy, setBusy] = useState(false)
  const [timeOpen, setTimeOpen] = useState(false)

  const load = useCallback(async () => {
    const [nextPermission, nextPreferences] = await Promise.all([
      getPushPermissionState(),
      api.getPushPreferences(),
    ])
    setPermission(nextPermission)
    setPreferences(nextPreferences)
  }, [api])

  useFocusEffect(
    useCallback(() => {
      let alive = true
      void load().catch(() => {
        if (alive) setPreferences(null)
      })
      return () => {
        alive = false
      }
    }, [load]),
  )

  const patch = async (value: ApiPushPreferencesPatch) => {
    if (!preferences || busy) return
    const previous = preferences
    setPreferences({ ...preferences, ...value })
    setBusy(true)
    try {
      setPreferences(await api.updatePushPreferences(value))
    } catch {
      setPreferences(previous)
      Alert.alert('Kaydedilemedi', 'Bildirim tercihini şu anda güncelleyemedik.')
    } finally {
      setBusy(false)
    }
  }

  const enablePermission = async () => {
    if (permission === 'denied') {
      await Linking.openSettings()
      return
    }
    setBusy(true)
    try {
      const state = await requestPushPermission()
      setPermission(state)
      if (state === 'granted') await syncCurrentPushDevice(api)
    } finally {
      setBusy(false)
    }
  }

  const onTimeChange = (event: DateTimePickerEvent, value?: Date) => {
    if (Platform.OS === 'android') setTimeOpen(false)
    if (event.type === 'dismissed' || !value) return
    void patch({ mealReminderTime: formatTime(value) })
  }

  return (
    <View className="mt-4 overflow-hidden rounded-2xl bg-surface">
      <View className="flex-row items-center gap-3 px-4 py-4">
        <IconBell size={22} color={emerald} />
        <View className="min-w-0 flex-1">
          <AppText weight="bold" className="text-ink">
            Bildirimler
          </AppText>
          <AppText className="mt-0.5 text-xs text-soft">{permissionLabel(permission)}</AppText>
        </View>
        {permission !== 'granted' && permission !== 'unavailable' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void enablePermission()}
            disabled={busy}
            hitSlop={8}
          >
            <AppText weight="semibold" className="text-xs text-emerald-700 dark:text-emerald-300">
              {permission === 'denied' ? 'Ayarları aç' : 'İzin ver'}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {preferences ? (
        <>
          <View className="border-t border-line/40" />
          <View className="flex-row items-center gap-3 px-4 py-3.5">
            <View className="min-w-0 flex-1">
              <AppText weight="semibold" className="text-ink">Öğün hatırlatması</AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Hatırlatma saati ${preferences.mealReminderTime}`}
                onPress={() => setTimeOpen((open) => !open)}
                disabled={!preferences.mealReminderEnabled || busy}
              >
                <AppText className="mt-0.5 text-xs text-soft">
                  Her gün {preferences.mealReminderTime}
                </AppText>
              </Pressable>
            </View>
            <Switch
              value={preferences.mealReminderEnabled}
              disabled={busy}
              onValueChange={(value) => void patch({ mealReminderEnabled: value })}
              trackColor={{ false: t.line, true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>
          {timeOpen && preferences.mealReminderEnabled ? (
            <View className="border-t border-line/40 px-4 py-2">
              <DateTimePicker
                value={timeDate(preferences.mealReminderTime)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minuteInterval={5}
                onChange={onTimeChange}
              />
            </View>
          ) : null}
          <View className="border-t border-line/40" />
          <NotificationToggle
            title="Afiyet haftası"
            subtitle="Kazandığın haftayı Afi kutlasın"
            value={preferences.weekClosureEnabled}
            disabled={busy}
            onChange={(value) => void patch({ weekClosureEnabled: value })}
            trackColor={t.line}
          />
          <View className="border-t border-line/40" />
          <NotificationToggle
            title="Sosyal"
            subtitle="Selam ve arkadaşlık hareketleri"
            value={preferences.socialEnabled}
            disabled={busy}
            onChange={(value) => void patch({ socialEnabled: value })}
            trackColor={t.line}
          />
          <View className="border-t border-line/40" />
          <NotificationToggle
            title="Duyurular"
            subtitle="afiet ekibinden ara sıra haberler"
            value={preferences.announcementsEnabled}
            disabled={busy}
            onChange={(value) => void patch({ announcementsEnabled: value })}
            trackColor={t.line}
          />
        </>
      ) : (
        <View className="border-t border-line/40 px-4 py-4">
          <AppText className="text-sm text-soft">Bildirim tercihleri yüklenemedi.</AppText>
          <Pressable accessibilityRole="button" onPress={() => void load()} className="pt-2">
            <AppText weight="semibold" className="text-sm text-emerald-700 dark:text-emerald-300">
              Tekrar dene
            </AppText>
          </Pressable>
        </View>
      )}
    </View>
  )
}

function NotificationToggle({
  title,
  subtitle,
  value,
  disabled,
  onChange,
  trackColor,
}: {
  title: string
  subtitle: string
  value: boolean
  disabled: boolean
  onChange: (value: boolean) => void
  trackColor: string
}) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3.5">
      <View className="min-w-0 flex-1">
        <AppText weight="semibold" className="text-ink">{title}</AppText>
        <AppText className="mt-0.5 text-xs text-soft">{subtitle}</AppText>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: trackColor, true: '#10b981' }}
        thumbColor="#ffffff"
      />
    </View>
  )
}
