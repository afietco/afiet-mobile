import { Redirect, router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth/AuthContext'
import { markFtueSeen } from '@/features/ftue/ftueFlags'
import { AppText } from '@/ui/AppText'
import { TextField } from '@/ui/inputs/TextField'

type Mode = 'signin' | 'signup'

export default function LoginScreen() {
  const { status, signIn, signUp } = useAuth()
  const insets = useSafeAreaInsets()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Zaten girişliyse uygulamaya dön.
  if (status === 'authed') return <Redirect href="/" />

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
          {mode === 'signin' ? 'Tekrar hoş geldin' : 'Hesap oluştur'}
        </AppText>

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
          onPress={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
          }}
          disabled={busy}
          className="mt-5 items-center"
        >
          <AppText weight="semibold" className="text-faint">
            {mode === 'signin' ? 'Hesabın yok mu? Kayıt ol' : 'Zaten hesabın var mı? Giriş yap'}
          </AppText>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}
