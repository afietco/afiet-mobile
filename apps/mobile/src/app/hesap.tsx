import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth/AuthContext'
import { ChangePasswordSheet } from '@/features/auth/ChangePasswordSheet'
import type { StackUser } from '@/features/auth/stackAuth'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconLock, IconLogout, IconMail } from '@/ui/icons'
import { ScreenHeader } from '@/ui/ScreenHeader'
import { Sheet } from '@/ui/Sheet'

/* Hesap ayarlarım - hamburger menüden açılır. E-posta satırı gerçek: kullanıcının
   Stack Auth e-postası ve doğrulama durumu okunur; doğrulanmamışsa rozetin
   yanındaki Doğrula ile doğrulama maili gönderilir (bağlantı afiet.co'daki
   sayfaya düşer, ekran odaklanınca rozet tazelenir). Şifre değiştirme gerçek
   (ChangePasswordSheet + AuthContext.changePassword); Apple ile gelen şifresiz
   kullanıcıda (hasPassword false) aynı satır "şifre belirle" moduna döner
   (sheet mode='set' + AuthContext.setPassword). Çıkış ve hesap silme de
   gerçek. E-posta DEĞİŞTİRME akışı şimdilik taslak (mock) - backend ucu bağlanınca
   "yakında" sheet'i yerini forma bırakır. */

export default function HesapScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const emerald = isDark ? '#34d399' : '#059669'
  const { api, signOut, deleteAuthUser, getStackUser, sendVerificationEmail } = useAuth()
  const [deleting, setDeleting] = useState(false)
  // E-posta değiştirme hâlâ taslak (mock sheet); şifre değiştirme gerçek forma
  // taşındı - üç ayrı durum: e-posta taslağı açık mı, şifre formu açık mı, ve
  // şifre işlemi bitti mi (satır altında sakin onay göstergesi; 'set' Apple'la
  // gelen şifresiz kullanıcının şifre BELİRLEMESİ, 'updated' normal değişiklik;
  // metin ayrımı için mod saklanır, boolean yetmez).
  const [emailSoon, setEmailSoon] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [pwDone, setPwDone] = useState<'updated' | 'set' | null>(null)
  // Stack Auth profili (gerçek e-posta + doğrulama durumu). null = okunamadı.
  const [stackUser, setStackUser] = useState<StackUser | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  // Doğrulama maili akışı: idle → sending → sent. 'sent' bu ekran ziyareti
  // boyunca kalır (tekrar tekrar mail gönderilmesin).
  const [verifyState, setVerifyState] = useState<'idle' | 'sending' | 'sent'>('idle')

  // Profil, ekran HER odaklandığında tazelenir (ilk açılış dahil): kullanıcı
  // mailindeki bağlantıyla doğrulayıp uygulamaya döndüğünde rozet güncellensin.
  // userLoading bilerek tekrar true yapılmaz; sonraki tazelemeler sessizdir.
  useFocusEffect(
    useCallback(() => {
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
    }, [getStackUser]),
  )

  const sendVerify = async () => {
    setVerifyState('sending')
    try {
      await sendVerificationEmail()
      setVerifyState('sent')
      // Rozeti tazele: e-posta aslında zaten doğrulanmışsa (stackAuth bu durumu
      // hata saymaz) kullanıcı maili beklemeden "Doğrulanmış"ı görür.
      try {
        const u = await getStackUser()
        setStackUser(u)
      } catch {
        // Sessizce yut: rozet bir sonraki odaklanmada tazelenir.
      }
    } catch (e) {
      setVerifyState('idle')
      Alert.alert(
        'Gönderilemedi',
        e instanceof Error ? e.message : 'Bir şeyler ters gitti, tekrar dene.',
      )
    }
  }

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

  // Apple (OAuth) ile gelen kullanıcının şifresi yoktur → satır "şifre belirle"
  // moduna döner. Profil okunamadıysa (null) şifreli varsayılır ki mevcut
  // kullanıcılar yanlışlıkla "şifre belirle" görmesin.
  const hasPassword = stackUser?.hasPassword !== false
  const pwMode = hasPassword ? 'update' : 'set'

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
            onPress={() => setEmailSoon(true)}
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
                  {/* Doğrulanmamışsa rozetin yanında doğrulama maili aksiyonu.
                      İç Pressable dokunuşu kendi alır; dış satır (e-posta
                      değiştir) tetiklenmez. */}
                  {!stackUser.primaryEmailVerified &&
                    (verifyState === 'sent' ? (
                      <AppText weight="semibold" className="text-xs text-soft">
                        Gönderildi ✓
                      </AppText>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Doğrulama e-postası gönder"
                        onPress={() => void sendVerify()}
                        disabled={verifyState === 'sending'}
                        hitSlop={8}
                      >
                        <AppText
                          weight="semibold"
                          className={`text-xs ${
                            verifyState === 'sending'
                              ? 'text-faint'
                              : 'text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {verifyState === 'sending' ? 'Gönderiliyor…' : 'Doğrula'}
                        </AppText>
                      </Pressable>
                    ))}
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
            onPress={() => {
              setPwDone(null)
              setPwOpen(true)
            }}
            className="flex-row items-center gap-3 px-4 py-4 active:bg-muted"
          >
            <IconLock size={22} color={emerald} />
            <View className="min-w-0 flex-1">
              <AppText weight="semibold" className="text-ink">
                Şifre
              </AppText>
              <AppText className="text-xs text-soft">
                {hasPassword
                  ? 'Giriş şifreni güncelle'
                  : 'Apple ile giriş yapıyorsun; istersen bir de şifre belirle'}
              </AppText>
            </View>
            <AppText weight="semibold" className="text-xs text-emerald-700 dark:text-emerald-300">
              {hasPassword ? 'Değiştir' : 'Belirle'}
            </AppText>
            <IconChevronRight size={16} color={t.faint} />
          </Pressable>
          {pwDone ? (
            <View className="border-t border-line/40 bg-emerald-500/10 px-4 py-3">
              <AppText weight="semibold" className="text-sm text-emerald-700 dark:text-emerald-300">
                {pwDone === 'set' ? 'Şifren belirlendi' : 'Şifren güncellendi'}
              </AppText>
              <AppText className="mt-0.5 text-xs text-soft">
                {pwDone === 'set'
                  ? 'Artık e-postan ve şifrenle de giriş yapabilirsin.'
                  : 'Diğer cihazlardaki oturumlar güvenlik için kapatıldı.'}
              </AppText>
            </View>
          ) : null}
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

      {/* E-posta değiştirme hâlâ taslak (bir sonraki faz). Şifre değiştirme gerçek
          forma taşındı (ChangePasswordSheet). */}
      <Sheet
        open={emailSoon}
        onClose={() => setEmailSoon(false)}
        title={
          <AppText weight="bold" className="text-lg text-ink">
            E-posta değiştir
          </AppText>
        }
      >
        <View className="gap-3">
          <AppText className="text-sm text-soft">
            E-posta adresini değiştirme akışı yakında burada olacak.
          </AppText>
          <View className="rounded-xl bg-muted/60 px-3.5 py-2.5">
            <AppText className="text-xs text-faint">
              Bu ekran arayüz taslağıdır; e-posta değişikliği bir sonraki sürümde
              bağlanacak. ✨
            </AppText>
          </View>
        </View>
      </Sheet>

      <ChangePasswordSheet
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        mode={pwMode}
        onSuccess={() => {
          setPwDone(pwMode === 'set' ? 'set' : 'updated')
          if (pwMode === 'set') {
            // Şifre belirlendi → profili tazele ki hasPassword true okunsun ve
            // satır normal "Değiştir" haline dönsün. Best-effort: okunamazsa
            // bir sonraki odaklanmada tazelenir.
            void getStackUser()
              .then((u) => setStackUser(u))
              .catch(() => {})
          }
        }}
      />
    </View>
  )
}

/* Doğrulama durumu rozeti: sakin ve yargılamayan. Doğrulanmışta yumuşak zümrüt,
   değilse nötr gri ton (kırmızı/uyarı yok, telaş yaratmaz). Doğrulama maili
   gönderme aksiyonu rozetin yanında, ekranın kendisinde yaşar. */
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
