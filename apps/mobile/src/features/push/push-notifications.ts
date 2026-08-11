import Constants from 'expo-constants'
import * as Crypto from 'expo-crypto'
import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { ApiError, type ApiClient, type ApiPushDeviceInput } from '@/data/api/client'

const INSTALLATION_ID_KEY = 'afiet.push.installation-id'
const PENDING_DEVICE_KEY = 'afiet.push.pending-device'
const SYNCED_DEVICE_KEY = 'afiet.push.synced-device'
const PRIMER_SEEN_KEY = 'afiet.push.primer-seen'
const PENDING_OPENS_KEY = 'afiet.push.pending-opens'
const FALLBACK_TIMEZONE = 'Europe/Istanbul'

/* Opens survive a restart, so a tap in a tunnel is still a tap. The failure
   this guards against is not symmetric: a lost open makes someone who did
   engage look like someone who ignored us, and the rules built on this
   measurement would then go quiet on exactly the wrong person.

   The cap bounds a device that has been offline for a long time. Dropping the
   oldest is right here: a stale open teaches less than a recent one, and the
   server keeps only the first open per notification anyway. */
const PENDING_OPENS_CAP = 50

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
    Notifications.setNotificationChannelAsync('davetler', {
      name: 'Davetler',
      description: 'İlk hafta rehberliği ve geri dönüş daveti',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180],
      lightColor: '#059669',
    }),
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

function deviceFingerprint(device: ApiPushDeviceInput): string {
  return [device.installationId, device.expoPushToken, device.timezone, device.appVersion].join('|')
}

async function persistPendingDevice(device: ApiPushDeviceInput, announce: boolean): Promise<void> {
  await SecureStore.setItemAsync(PENDING_DEVICE_KEY, JSON.stringify(device))
  if (!announce) return
  // Acquiring a token can itself fire the native token listener, so announcing
  // a device that is already registered would wake the sync that acquired it.
  if ((await SecureStore.getItemAsync(SYNCED_DEVICE_KEY)) === deviceFingerprint(device)) return
  for (const listener of tokenListeners) listener()
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

  // Registering an unchanged device is not just noise: the token lookup above
  // can fire the native token listener, which announces a rotation and calls
  // this function again, so an unconditional upsert feeds itself indefinitely.
  const fingerprint = deviceFingerprint(device)
  if ((await SecureStore.getItemAsync(SYNCED_DEVICE_KEY)) !== fingerprint) {
    await api.upsertPushDevice(device)
    await SecureStore.setItemAsync(SYNCED_DEVICE_KEY, fingerprint)
  }
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
    SecureStore.deleteItemAsync(SYNCED_DEVICE_KEY),
    SecureStore.deleteItemAsync('afiet.push.pending-target'),
    // Queued opens belong to the account that was signed in. The server would
    // refuse them for anyone else, but sending another person's ids at all is
    // not something to rely on being refused.
    SecureStore.deleteItemAsync(PENDING_OPENS_KEY),
  ])
  try {
    await Notifications.unregisterForNotificationsAsync()
  } catch {
    // Native unregister is best-effort during logout and account deletion.
  }
}

async function readPendingOpens(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(PENDING_OPENS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    // A corrupt record costs only the opens it held.
    return []
  }
}

/**
 * Remembers that a notification was opened. Queued rather than sent, because
 * the moment of a tap is also the moment the app is still starting up and the
 * account may not be readable yet.
 */
export async function queuePushOpen(eventId: string): Promise<void> {
  const queued = await readPendingOpens()
  if (queued.includes(eventId)) return
  queued.push(eventId)
  await SecureStore.setItemAsync(
    PENDING_OPENS_KEY,
    JSON.stringify(queued.slice(-PENDING_OPENS_CAP)),
  )
}

/**
 * Sends what the queue holds. Called on sign-in and on every foreground, which
 * is also when a tap that started the app arrives.
 *
 * An id the server rejects for good (it belongs to nobody, or to somebody else)
 * is dropped rather than retried forever; anything else stays queued.
 */
export async function flushPushOpens(api: ApiClient): Promise<void> {
  const queued = await readPendingOpens()
  if (queued.length === 0) return
  const unsent: string[] = []
  for (const eventId of queued) {
    try {
      await api.markPushOpened(eventId)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status < 400 || error.status >= 500) {
        unsent.push(eventId)
      }
    }
  }
  if (unsent.length === 0) await SecureStore.deleteItemAsync(PENDING_OPENS_KEY)
  else await SecureStore.setItemAsync(PENDING_OPENS_KEY, JSON.stringify(unsent))
}

export function onPushTokenAvailable(listener: () => void): () => void {
  tokenListeners.add(listener)
  return () => tokenListeners.delete(listener)
}

export async function handleNativeTokenRotation(): Promise<void> {
  await refreshPendingDevice(true)
}
