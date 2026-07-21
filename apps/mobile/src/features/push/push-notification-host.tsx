import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { useAuth } from '@/features/auth/AuthContext'
import { refreshNotifications } from '@/features/notifications/notifications'
import { requestWeekClosureRefresh } from '@/features/sofra/useWeekClosure'
import {
  ensureNotificationChannels,
  handleNativeTokenRotation,
  onPushTokenAvailable,
  syncCurrentPushDevice,
} from './push-notifications'
import { parsePushTarget, routeForPushTarget, type PushTarget } from './push-target'

const PENDING_TARGET_KEY = 'afiet.push.pending-target'

function targetFromResponse(response: Notifications.NotificationResponse): PushTarget | null {
  return parsePushTarget(response.notification.request.content.data?.target)
}

export function PushNotificationHost() {
  const { status, api } = useAuth()
  const syncInFlight = useRef(false)

  useEffect(() => {
    void ensureNotificationChannels()
  }, [])

  useEffect(() => {
    if (status !== 'authed') return
    const sync = () => {
      if (syncInFlight.current) return
      syncInFlight.current = true
      void syncCurrentPushDevice(api)
        .catch((error) => console.warn('[push] device sync failed', error))
        .finally(() => {
          syncInFlight.current = false
        })
    }
    sync()
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') sync()
    })
    const pending = onPushTokenAvailable(sync)
    const token = Notifications.addPushTokenListener(() => {
      void handleNativeTokenRotation()
    })
    return () => {
      appState.remove()
      pending()
      token.remove()
    }
  }, [api, status])

  useEffect(() => {
    const open = async (target: PushTarget) => {
      if (status !== 'authed') {
        await SecureStore.setItemAsync(PENDING_TARGET_KEY, target)
        return
      }
      await SecureStore.deleteItemAsync(PENDING_TARGET_KEY)
      router.push(routeForPushTarget(target))
      if (target === 'week_closure') requestWeekClosureRefresh()
      if (target === 'notifications' || target === 'friend_requests' || target === 'friends') {
        void refreshNotifications()
      }
    }

    const initial = Notifications.getLastNotificationResponse()
    const initialTarget = initial ? targetFromResponse(initial) : null
    if (initialTarget) {
      void open(initialTarget)
      Notifications.clearLastNotificationResponse()
    }

    if (status === 'authed') {
      void SecureStore.getItemAsync(PENDING_TARGET_KEY).then((pending) => {
        const target = parsePushTarget(pending)
        if (target) void open(target)
      })
    }

    const response = Notifications.addNotificationResponseReceivedListener((event) => {
      const target = targetFromResponse(event)
      if (target) void open(target)
    })
    const received = Notifications.addNotificationReceivedListener((notification) => {
      const target = parsePushTarget(notification.request.content.data?.target)
      if (target === 'notifications' || target === 'friend_requests' || target === 'friends') {
        void refreshNotifications()
      }
    })
    return () => {
      response.remove()
      received.remove()
    }
  }, [api, status])

  return null
}
