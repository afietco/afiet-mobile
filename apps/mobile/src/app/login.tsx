import { Redirect, router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth/AuthContext'
import { sendPasswordResetCode } from '@/features/auth/stackAuth'
import { markFtueSeen } from '@/features/ftue/ftueFlags'
import { AppText } from '@/ui/AppText'
import { TextField } from '@/ui/inputs/TextField'

// 'reset': şifremi unuttum görünümü. Ayrı ekran/sheet değil, login kartı
// içinde state ile geçilen üçüncü mod (e-posta alanı ortak kalır, signin'de
// yazılan adres önceden dolu gelir).
type Mode = 'signin' | 'signup' | 'reset'

export default function LoginScreen() {
  const { status, signIn, signUp } = useAuth()
  const insets = useSafeAreaInsets()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Sıfırlama bağlantısı gönderildi mi (reset görünümündeki sakin başarı hali).
  const [resetSent, setResetSent] = useState(false)

  // Zaten girişliyse uygulamaya dön.
  if (status === 'authed') return <Redirect href="/" />

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
      // Girişi başaran kullanıcı tanıtımı görmüş sayılır (çıkışta tur tekrarlanmasın)
      markFtueSeen('welcomeIntro')
      router.replace('/')
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
      // Uç, e-posta kayıtlı olmasa da 200 döner (enumerasyon koruması);
      // kullanıcıya her koşulda aynı sakin onay gösterilir.
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
      <View
        className="flex-1 justify-center px-7"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
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
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}
