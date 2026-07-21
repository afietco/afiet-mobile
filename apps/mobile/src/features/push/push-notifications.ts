import Constants from 'expo-constants'
import * as Crypto from 'expo-crypto'
import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import type { ApiClient, ApiPushDeviceInput } from '@/data/api/client'

const INSTALLATION_ID_KEY = 'afiet.push.installation-id'
const PENDING_DEVICE_KEY = 'afiet.push.pending-device'
const PRIMER_SEEN_KEY = 'afiet.push.primer-seen'
const FALLBACK_TIMEZONE = 'Europe/Istanbul'

export type PushPermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable'

const tokenListeners = new Set<() => void>()

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return
  await Promise.all([
    Notifications.setNotificationChannelAsync('hatirlatmalar', {
      name: 'Hatırlatmalar',
      description: 'Öğün ekleme hatırlatmaları',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180],
      lightColor: '#059669',
    }),
    Notifications.setNotificationChannelAsync('kutlamalar', {
      name: 'Kutlamalar',
      description: 'Afiyet haftası kutlamaları',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      lightColor: '#059669',
    }),
    Notifications.setNotificationChannelAsync('sosyal', {
      name: 'Sosyal',
      description: 'Selam ve arkadaşlık bildirimleri',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180],
      lightColor: '#F59E0B',
    }),
    // Channel ids are chosen by the backend's kind-to-channel mapping in
    // store/push.go; both sides must name the same string.
    Notifications.setNotificationChannelAsync('duyurular', {
      name: 'Duyurular',
      description: 'afiet ekibinden haberler',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180],
      lightColor: '#059669',
    }),
  ])
}

function permissionState(status: Notifications.NotificationPermissionsStatus): PushPermissionState {
  if (Platform.OS !== 'ios') {
    if (status.granted) return 'granted'
    return status.canAskAgain ? 'undetermined' : 'denied'
  }
  switch (status.ios?.status) {
    case Notifications.IosAuthorizationStatus.AUTHORIZED:
    case Notifications.IosAuthorizationStatus.PROVISIONAL:
    case Notifications.IosAuthorizationStatus.EPHEMERAL:
      return 'granted'
    case Notifications.IosAuthorizationStatus.DENIED:
      return 'denied'
    default:
      return 'undetermined'
  }
}

export async function getPushPermissionState(): Promise<PushPermissionState> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return 'unavailable'
  try {
    return permissionState(await Notifications.getPermissionsAsync())
  } catch {
    return 'unavailable'
  }
}

export async function shouldShowPushPrimer(): Promise<boolean> {
  if ((await SecureStore.getItemAsync(PRIMER_SEEN_KEY)) === '1') return false
  return (await getPushPermissionState()) === 'undetermined'
}

function timezone(): string {
  try {
    const value = Intl.DateTimeFormat().resolvedOptions().timeZone
    return value === 'UTC' || value?.includes('/') ? value : FALLBACK_TIMEZONE
  } catch {
    return FALLBACK_TIMEZONE
  }
}

async function installationID(): Promise<string> {
  const current = await SecureStore.getItemAsync(INSTALLATION_ID_KEY)
  if (current) return current
  const created = Crypto.randomUUID()
  await SecureStore.setItemAsync(INSTALLATION_ID_KEY, created)
  return created
}

function projectID(): string | null {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null
}

async function createDeviceRegistration(): Promise<ApiPushDeviceInput> {
  const id = projectID()
  if (!id) throw new Error('EAS project ID bulunamadı')
  const token = await Notifications.getExpoPushTokenAsync({ projectId: id })
  return {
    installationId: await installationID(),
    expoPushToken: token.data,
    platform: Platform.OS as 'ios' | 'android',
    timezone: timezone(),
    appVersion: Constants.expoConfig?.version ?? 'unknown',
  }
}

async function persistPendingDevice(device: ApiPushDeviceInput, announce: boolean): Promise<void> {
  await SecureStore.setItemAsync(PENDING_DEVICE_KEY, JSON.stringify(device))
  if (announce) {
    for (const listener of tokenListeners) listener()
  }
}

async function refreshPendingDevice(announce = false): Promise<ApiPushDeviceInput | null> {
  if ((await getPushPermissionState()) !== 'granted') return null
  try {
    const device = await createDeviceRegistration()
    await persistPendingDevice(device, announce)
    return device
  } catch {
    // Token acquisition requires network access; foreground sync retries later.
    return null
  }
}

export async function requestPushPermission(): Promise<PushPermissionState> {
  await SecureStore.setItemAsync(PRIMER_SEEN_KEY, '1')
  await ensureNotificationChannels()
  const current = await Notifications.getPermissionsAsync()
  const currentState = permissionState(current)
  const final =
    currentState === 'undetermined' ? await Notifications.requestPermissionsAsync() : current
  const state = permissionState(final)
  if (state === 'granted') await refreshPendingDevice(true)
  return state
}

export async function dismissPushPrimer(): Promise<void> {
  await SecureStore.setItemAsync(PRIMER_SEEN_KEY, '1')
}

export async function syncCurrentPushDevice(api: ApiClient): Promise<void> {
  if ((await getPushPermissionState()) !== 'granted') return
  let device: ApiPushDeviceInput | null = null
  const raw = await SecureStore.getItemAsync(PENDING_DEVICE_KEY)
  if (raw) {
    try {
      device = JSON.parse(raw) as ApiPushDeviceInput
    } catch {
      await SecureStore.deleteItemAsync(PENDING_DEVICE_KEY)
    }
  }
  device ??= await refreshPendingDevice()
  if (!device) return
  device.timezone = timezone()
  device.appVersion = Constants.expoConfig?.version ?? device.appVersion
  await api.upsertPushDevice(device)
  await SecureStore.deleteItemAsync(PENDING_DEVICE_KEY)
}

export async function unregisterCurrentPushDevice(api: ApiClient): Promise<void> {
  const id = await SecureStore.getItemAsync(INSTALLATION_ID_KEY)
  if (id) {
    try {
      await api.deletePushDevice(id)
    } catch {
      // Local logout must still complete when the backend is unavailable.
    }
  }
  await clearLocalPushRegistration()
}

export async function clearLocalPushRegistration(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(PENDING_DEVICE_KEY),
    SecureStore.deleteItemAsync('afiet.push.pending-target'),
  ])
  try {
    await Notifications.unregisterForNotificationsAsync()
  } catch {
    // Native unregister is best-effort during logout and account deletion.
  }
}

export function onPushTokenAvailable(listener: () => void): () => void {
  tokenListeners.add(listener)
  return () => tokenListeners.delete(listener)
}

export async function handleNativeTokenRotation(): Promise<void> {
  await refreshPendingDevice(true)
}
