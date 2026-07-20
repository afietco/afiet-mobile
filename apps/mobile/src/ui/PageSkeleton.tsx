import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'
import { Skeleton } from './Skeleton'

interface PageSkeletonProps {
  error?: unknown
  onRetry?: () => void
  timeoutMs?: number
}

/** Full-page loading state with an optional timeout and recoverable error mode. */
export function PageSkeleton({ error, onRetry, timeoutMs = 10_000 }: PageSkeletonProps) {
  const insets = useSafeAreaInsets()
  const [timedOut, setTimedOut] = useState(false)
  const [timeoutAttempt, setTimeoutAttempt] = useState(0)
  const hasError = error != null
  const canRetry = onRetry != null

  useEffect(() => {
    if (hasError || !canRetry) return
    setTimedOut(false)
    const timer = setTimeout(() => setTimedOut(true), timeoutMs)
    return () => clearTimeout(timer)
  }, [canRetry, hasError, timeoutAttempt, timeoutMs])

  if (hasError || timedOut) {
    const canGoBack = router.canGoBack()
    return (
      <View
        className="flex-1 items-center justify-center bg-canvas px-8"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
      >
        <AfiPose pose="oops" size={96} />
        <AppText weight="extrabold" className="mt-3 text-center text-2xl text-ink">
          Bağlantı kurulamadı
        </AppText>
        <AppText className="mt-2 max-w-sm text-center leading-6 text-soft">
          Bağlantını kontrol edip birazdan yeniden deneyebilirsin.
        </AppText>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Verileri yeniden yükle"
            onPress={() => {
              setTimedOut(false)
              setTimeoutAttempt((current) => current + 1)
              onRetry()
            }}
            className="mt-7 rounded-2xl bg-emerald-600 px-7 py-3.5 active:opacity-90"
          >
            <AppText weight="bold" className="text-base text-white">
              Tekrar dene
            </AppText>
          </Pressable>
        ) : null}
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Önceki ekrana dön"
            onPress={() => router.back()}
            className="mt-3 px-6 py-3"
          >
            <AppText weight="semibold" className="text-soft">
              Geri dön
            </AppText>
          </Pressable>
        ) : null}
      </View>
    )
  }

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        scrollEnabled={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <View className="mb-6 flex-row items-center gap-3">
          <AfiPose pose="temel" motion="yukleniyor" size={40} />
          <View className="gap-2">
            <Skeleton width={160} height={18} />
            <Skeleton width={104} height={12} />
          </View>
        </View>

        <View className="gap-3">
          <Skeleton height={128} radius={16} />
          <Skeleton height={92} radius={16} />
          <Skeleton height={140} radius={16} />
          <Skeleton height={96} radius={16} />
        </View>
      </ScrollView>
    </View>
  )
}
