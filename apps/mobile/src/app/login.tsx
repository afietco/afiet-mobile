import * as AppleAuthentication from 'expo-apple-authentication'
import { Redirect, router, useLocalSearchParams, type Href } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth/AuthContext'
import { safeAuthReturnPath, SESSION_EXPIRED_REASON } from '@/features/auth/auth-return'
import { sendPasswordResetCode } from '@/features/auth/stackAuth'
import { markFtueSeen } from '@/features/ftue/ftueFlags'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GoogleLogo } from '@/ui/GoogleLogo'
import { TextField } from '@/ui/inputs/TextField'

// Reset is the third state within the login card. It reuses the email field so
// an address entered during sign-in remains available.
type Mode = 'signin' | 'signup' | 'reset'

export default function LoginScreen() {
  const params = useLocalSearchParams<{
    mode?: string | string[]
    reason?: string | string[]
    returnTo?: string | string[]
  }>()
  const requestedMode = Array.isArray(params.mode) ? params.mode[0] : params.mode
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason
  const returnPath = safeAuthReturnPath(params.returnTo) as Href
  const sessionExpired = reason === SESSION_EXPIRED_REASON
  const { status, signIn, signUp, signInWithApple, signInWithGoogle } = useAuth()
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const [mode, setMode] = useState<Mode>(requestedMode === 'signup' ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Tracks the quiet success state after requesting a reset link.
  const [resetSent, setResetSent] = useState(false)
  // Apple sign-in is shown only on supported iOS devices.
  const [appleAvailable, setAppleAvailable] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'ios') return
    let alive = true
    AppleAuthentication.isAvailableAsync()
      .then((ok) => {
        if (alive) setAppleAvailable(ok)
      })
      .catch(() => {
        // Email sign-in remains available if the capability check fails.
      })
    return () => {
      alive = false
    }
  }, [])

  // Authenticated users return directly to the application.
  if (status === 'authed') return <Redirect href={returnPath} />

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setResetSent(false)
  }

  async function submit() {
    setError(null)
    if (!email.trim() || !password) {
      setError('E-posta ve şifre gerekli.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signin') await signIn(email.trim(), password)
      else await signUp(email.trim(), password)
      // Successful authentication prevents the welcome tour from repeating after sign-out.
      markFtueSeen('welcomeIntro')
      router.replace(returnPath)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir şeyler ters gitti.')
    } finally {
      setBusy(false)
    }
  }

  async function submitApple() {
    if (busy) return
    setError(null)
    setBusy(true)
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
      if (!credential.identityToken) {
        setError('Bir şeyler ters gitti.')
        return
      }
      // Apple provides the name only on first authorization, so forward it when available.
      const suggestedName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ')
        .trim()
      await signInWithApple(credential.identityToken, suggestedName || null)
      // Keep the welcome-tour behavior consistent across authentication methods.
      markFtueSeen('welcomeIntro')
      router.replace(returnPath)
    } catch (e) {
      // Closing the Apple dialog is a cancellation, not an error.
      if ((e as { code?: string } | null)?.code === 'ERR_REQUEST_CANCELED') return
      setError(e instanceof Error ? e.message : 'Bir şeyler ters gitti.')
    } finally {
      setBusy(false)
    }
  }

  async function submitGoogle() {
    if (busy) return
    setError(null)
    setBusy(true)
    try {
      const ok = await signInWithGoogle()
      // False means the user closed the browser and cancelled the flow.
      if (!ok) return
      // Keep the welcome-tour behavior consistent across authentication methods.
      markFtueSeen('welcomeIntro')
      router.replace(returnPath)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir şeyler ters gitti.')
    } finally {
      setBusy(false)
    }
  }

  async function submitReset() {
    setError(null)
    if (!email.trim()) {
      setError('E-posta gerekli.')
      return
    }
    setBusy(true)
    try {
      await sendPasswordResetCode(email.trim())
      // The endpoint always succeeds to prevent account enumeration.
      setResetSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir şeyler ters gitti.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-canvas"
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 28,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="mb-10 items-center">
          <AppText weight="extrabold" className="text-5xl text-emerald-600">
            afiet
          </AppText>
          <AppText weight="semibold" className="mt-1 text-lg text-faint">
            Sayma, dengele.
          </AppText>
        </View>

        <AppText weight="bold" className="mb-4 text-2xl text-ink">
          {mode === 'signin'
            ? 'Tekrar hoş geldin'
            : mode === 'signup'
              ? 'Hesap oluştur'
              : 'Şifreni sıfırla'}
        </AppText>

        {sessionExpired && mode === 'signin' ? (
          <View className="mb-5 rounded-2xl bg-amber-500/10 px-5 py-4">
            <AppText weight="bold" className="text-ink">
              Oturumun sona erdi
            </AppText>
            <AppText className="mt-1 text-sm leading-5 text-soft">
              Güvenliğin için yeniden giriş yapman gerekiyor. Girişten sonra kaldığın yere
              döneceksin.
            </AppText>
          </View>
        ) : null}

        {mode === 'reset' ? (
          resetSent ? (
            <>
              <View className="rounded-2xl bg-emerald-500/10 px-5 py-4">
                <AppText weight="semibold" className="text-emerald-700 dark:text-emerald-300">
                  Bağlantıyı e-postana gönderdik.
                </AppText>
                <AppText className="mt-1 text-sm text-soft">
                  Gelen kutunu (gerekirse spam'i) kontrol et.
                </AppText>
              </View>
              <Pressable onPress={() => switchMode('signin')} className="mt-5 items-center">
                <AppText weight="semibold" className="text-faint">
                  Girişe dön
                </AppText>
              </Pressable>
            </>
          ) : (
            <>
              <AppText className="mb-4 text-soft">
                Kayıtlı e-postana bir sıfırlama bağlantısı gönderelim.
              </AppText>
              <TextField
                placeholder="E-posta"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!busy}
              />

              {error != null && (
                <AppText weight="semibold" className="mt-3 text-rose-500">
                  {error}
                </AppText>
              )}

              <Pressable
                onPress={() => void submitReset()}
                disabled={busy}
                className={`mt-6 items-center rounded-2xl py-4 ${busy ? 'bg-emerald-400' : 'bg-emerald-500'}`}
              >
                {busy ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <AppText weight="bold" className="text-lg text-white">
                    Bağlantı gönder
                  </AppText>
                )}
              </Pressable>

              <Pressable
                onPress={() => switchMode('signin')}
                disabled={busy}
                className="mt-5 items-center"
              >
                <AppText weight="semibold" className="text-faint">
                  Girişe dön
                </AppText>
              </Pressable>
            </>
          )
        ) : (
          <>
            <View className="gap-3">
              <TextField
                placeholder="E-posta"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!busy}
              />
              <TextField
                placeholder="Şifre"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                editable={!busy}
              />
            </View>

            {mode === 'signin' && (
              <Pressable
                onPress={() => switchMode('reset')}
                disabled={busy}
                hitSlop={8}
                className="mt-2 self-end"
              >
                <AppText weight="semibold" className="text-sm text-faint">
                  Şifremi unuttum
                </AppText>
              </Pressable>
            )}

            {error != null && (
              <AppText weight="semibold" className="mt-3 text-rose-500">
                {error}
              </AppText>
            )}

            <Pressable
              onPress={submit}
              disabled={busy}
              className={`mt-6 items-center rounded-2xl py-4 ${busy ? 'bg-emerald-400' : 'bg-emerald-500'}`}
            >
              {busy ? (
                <ActivityIndicator color="white" />
              ) : (
                <AppText weight="bold" className="text-lg text-white">
                  {mode === 'signin' ? 'Giriş yap' : 'Kayıt ol'}
                </AppText>
              )}
            </Pressable>

            <Pressable
              onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              disabled={busy}
              className="mt-5 items-center"
            >
              <AppText weight="semibold" className="text-faint">
                {mode === 'signin' ? 'Hesabın yok mu? Kayıt ol' : 'Zaten hesabın var mı? Giriş yap'}
              </AppText>
            </Pressable>

            {/* Google is always available; Apple appears only on supported iOS devices. */}
            <View className="mt-6 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-line" />
              <AppText weight="semibold" className="text-xs text-faint">
                veya
              </AppText>
              <View className="h-px flex-1 bg-line" />
            </View>

            {/* The required system Apple button is disabled through its wrapper while busy. */}
            {appleAvailable && (
              <View
                pointerEvents={busy ? 'none' : 'auto'}
                className={`mt-6 ${busy ? 'opacity-40' : ''}`}
              >
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={
                    isDark
                      ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                      : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                  }
                  cornerRadius={16}
                  style={{ width: '100%', height: 52 }}
                  onPress={() => void submitApple()}
                />
              </View>
            )}

            {/* Google branding is preserved while matching the app's control dimensions. */}
            <Pressable
              onPress={() => void submitGoogle()}
              disabled={busy}
              className={`${appleAvailable ? 'mt-3' : 'mt-6'} flex-row items-center justify-center gap-3 rounded-2xl border border-line bg-white dark:border-transparent dark:bg-[#131314] ${busy ? 'opacity-40' : ''}`}
              style={{ height: 52 }}
            >
              <GoogleLogo size={20} />
              <AppText weight="semibold" className="text-base text-ink dark:text-white">
                Google ile devam et
              </AppText>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
