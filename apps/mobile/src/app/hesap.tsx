import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth/AuthContext'
import type { StackUser } from '@/features/auth/stackAuth'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconLock, IconLogout, IconMail } from '@/ui/icons'
import { ScreenHeader } from '@/ui/ScreenHeader'
import { Sheet } from '@/ui/Sheet'

/* Hesap ayarlarım - hamburger menüden açılır. E-posta satırı gerçek: kullanıcının
   Stack Auth e-postası ve doğrulama durumu okunur. Çıkış ve hesap silme gerçek
   (AuthContext); e-posta/şifre DEĞİŞTİRME akışları şimdilik taslak (mock) - backend
   uçları bağlanınca "yakında" sheet'i yerini forma bırakır. */

export default function HesapScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const emerald = isDark ? '#34d399' : '#059669'
  const { api, signOut, deleteAuthUser, getStackUser } = useAuth()
  const [deleting, setDeleting] = useState(false)
  const [soon, setSoon] = useState<null | 'email' | 'password'>(null)
  // Stack Auth profili (gerçek e-posta + doğrulama durumu). null = okunamadı.
  const [stackUser, setStackUser] = useState<StackUser | null>(null)
  const [userLoading, setUserLoading] = useState(true)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const u = await getStackUser()
        if (alive) setStackUser(u)
      } catch {
        // Sessizce yut: e-posta okunamazsa sabit alt metne düşülür, rozet çıkmaz.
      } finally {
        if (alive) setUserLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [getStackUser])

  const doDelete = async () => {
    setDeleting(true)
    try {
      await api.deleteAccount() // backend: tüm veriyi kalıcı sil
      await deleteAuthUser() // best-effort: Stack Auth kimliğini de sil
      await signOut() // token'ı at; status → anon → /login
    } catch (e) {
      setDeleting(false)
      Alert.alert('Silinemedi', e instanceof Error ? e.message : 'Bir şeyler ters gitti, tekrar dene.')
    }
  }

  const confirmDelete = () => {
    Alert.alert(
      'Hesabını sil?',
      'Tüm verilerin — kayıtların, ölçülerin, profilin — kalıcı olarak silinir. Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Hesabı sil', style: 'destructive', onPress: () => void doDelete() },
      ],
    )
  }

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <ScreenHeader title="Hesap ayarlarım" />

        {/* Kimlik bilgileri */}
        <View className="overflow-hidden rounded-2xl bg-surface">
          <Pressable
            accessibilityRole="button"
            onPress={() => setSoon('email')}
            className="flex-row items-center gap-3 px-4 py-4 active:bg-muted"
          >
            <IconMail size={22} color={emerald} />
            <View className="min-w-0 flex-1">
              <AppText weight="semibold" className="text-ink">
                E-posta
              </AppText>
              {userLoading ? (
                <AppText className="text-xs text-faint">Yükleniyor…</AppText>
              ) : stackUser?.primaryEmail ? (
                <View className="mt-0.5 flex-row items-center gap-2">
                  <AppText numberOfLines={1} className="shrink text-xs text-soft">
                    {stackUser.primaryEmail}
                  </AppText>
                  <VerifyBadge verified={stackUser.primaryEmailVerified} />
                </View>
              ) : (
                <AppText className="text-xs text-soft">Giriş yaptığın e-posta adresi</AppText>
              )}
            </View>
            <AppText weight="semibold" className="text-xs text-emerald-700 dark:text-emerald-300">
              Değiştir
            </AppText>
            <IconChevronRight size={16} color={t.faint} />
          </Pressable>
          <View className="border-t border-line/40" />
          <Pressable
            accessibilityRole="button"
            onPress={() => setSoon('password')}
            className="flex-row items-center gap-3 px-4 py-4 active:bg-muted"
          >
            <IconLock size={22} color={emerald} />
            <View className="min-w-0 flex-1">
              <AppText weight="semibold" className="text-ink">
                Şifre
              </AppText>
              <AppText className="text-xs text-soft">Giriş şifreni güncelle</AppText>
            </View>
            <AppText weight="semibold" className="text-xs text-emerald-700 dark:text-emerald-300">
              Değiştir
            </AppText>
            <IconChevronRight size={16} color={t.faint} />
          </Pressable>
        </View>

        {/* Oturum */}
        <View className="mt-4 rounded-2xl bg-surface p-5">
          <AppText weight="bold" className="mb-3 text-ink">
            Oturum
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => void signOut()}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-muted py-3"
          >
            <IconLogout size={18} color={t.soft} />
            <AppText weight="semibold" className="text-soft">
              Çıkış yap
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hesabı ve tüm verileri sil"
            onPress={confirmDelete}
            disabled={deleting}
            className="mt-2 flex-row items-center justify-center rounded-xl py-3"
          >
            <AppText weight="semibold" className="text-red-600 dark:text-red-400">
              {deleting ? 'Siliniyor…' : 'Hesabı sil'}
            </AppText>
          </Pressable>
          <AppText className="mt-2 text-center text-xs text-faint">
            Hesabını silersen tüm verilerin kalıcı olarak kaldırılır.
          </AppText>
        </View>
      </ScrollView>

      <Sheet
        open={soon !== null}
        onClose={() => setSoon(null)}
        title={
          <AppText weight="bold" className="text-lg text-ink">
            {soon === 'password' ? 'Şifre değiştir' : 'E-posta değiştir'}
          </AppText>
        }
      >
        <View className="gap-3">
          <AppText className="text-sm text-soft">
            {soon === 'password'
              ? 'Şifreni güncelleme akışı yakında burada olacak.'
              : 'E-posta adresini değiştirme akışı yakında burada olacak.'}
          </AppText>
          <View className="rounded-xl bg-muted/60 px-3.5 py-2.5">
            <AppText className="text-xs text-faint">
              Bu ekran arayüz taslağıdır; hesap değişiklikleri bir sonraki sürümde
              bağlanacak. ✨
            </AppText>
          </View>
        </View>
      </Sheet>
    </View>
  )
}

/* Doğrulama durumu rozeti: sakin ve yargılamayan. Doğrulanmışta yumuşak zümrüt,
   değilse nötr gri ton (kırmızı/uyarı yok, telaş yaratmaz). Doğrulama maili
   gönderme akışı bir sonraki fazda gelecek. */
function VerifyBadge({ verified }: { verified: boolean }) {
  return (
    <View className={`rounded-full px-2 py-0.5 ${verified ? 'bg-emerald-500/15' : 'bg-muted'}`}>
      <AppText
        weight="semibold"
        className={`text-xs ${verified ? 'text-emerald-700 dark:text-emerald-300' : 'text-soft'}`}
      >
        {verified ? 'Doğrulanmış' : 'Doğrulanmamış'}
      </AppText>
    </View>
  )
}
