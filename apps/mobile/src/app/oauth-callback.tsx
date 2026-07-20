import { Redirect } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth/AuthContext'
import { authErrorMessage } from '@/features/auth/authErrorMessage'
import { isGoogleSignInFlowActive } from '@/features/auth/googleSignIn'
import { markFtueSeen } from '@/features/ftue/ftueFlags'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'
import { PageSkeleton } from '@/ui/PageSkeleton'

type RecoveryState = 'idle' | 'restarting' | 'retry'

export default function OAuthCallbackScreen() {
  const { status, signInWithGoogle } = useAuth()
  const insets = useSafeAreaInsets()
  const started = useRef(false)
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const restartGoogleSignIn = useCallback(async () => {
    if (isGoogleSignInFlowActive()) return
    setRecoveryState('restarting')
    setMessage(null)
    try {
      const authenticated = await signInWithGoogle()
      if (authenticated) {
        markFtueSeen('welcomeIntro')
        return
      }
      setMessage('Google girişi tamamlanmadı. Hazır olduğunda yeniden deneyebilirsin.')
    } catch (error) {
      setMessage(authErrorMessage(error))
    }
    setRecoveryState('retry')
  }, [signInWithGoogle])

  useEffect(() => {
    if (status !== 'anon' || started.current || isGoogleSignInFlowActive()) return
    started.current = true
    void restartGoogleSignIn()
  }, [restartGoogleSignIn, status])

  if (status === 'loading') return <PageSkeleton />
  if (status === 'authed') return <Redirect href="/(tabs)" />

  const restarting = recoveryState !== 'retry'

  return (
    <View
      className="flex-1 items-center justify-center bg-canvas px-7"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <AfiPose pose={restarting ? 'merak' : 'oops'} size={112} />
      <AppText weight="extrabold" className="mt-5 text-center text-2xl text-ink">
        Google girişine dönüyoruz
      </AppText>
      <AppText className="mt-2 text-center text-sm text-soft">
        {message ?? 'Önceki giriş yarıda kaldı. Güvenli bir şekilde yeniden başlatıyoruz.'}
      </AppText>

      {restarting ? (
        <View className="mt-6 flex-row items-center gap-2">
          <ActivityIndicator color="#059669" />
          <AppText weight="semibold" className="text-sm text-soft">
            Google açılıyor…
          </AppText>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => void restartGoogleSignIn()}
          className="mt-6 rounded-xl bg-emerald-600 px-6 py-3.5"
        >
          <AppText weight="semibold" className="text-white">
            Google ile yeniden dene
          </AppText>
        </Pressable>
      )}
    </View>
  )
}
