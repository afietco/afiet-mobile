import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth/AuthContext'
import { ChangeEmailSheet } from '@/features/auth/ChangeEmailSheet'
import { ChangePasswordSheet } from '@/features/auth/ChangePasswordSheet'
import type { StackUser } from '@/features/auth/stackAuth'
import { UsernameSheet } from '@/features/profile/UsernameSheet'
import { PushSettingsCard } from '@/features/push/push-settings-card'
import { useMyUsername } from '@/features/social/store'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconLock, IconLogout, IconMail, IconUser } from '@/ui/icons'
import { ScreenHeader } from '@/ui/ScreenHeader'

/* Hesap ayarlarım - hamburger menüden açılır. Kullanıcı adı satırı gerçek:
   mevcut @handle useMyUsername ile okunur, dokununca UsernameSheet açılır
   (belirle/değiştir; setUsername + 409 sakin ele alınır, profilden açılanla
   aynı sheet). E-posta satırı gerçek: kullanıcının
   Stack Auth e-postası ve doğrulama durumu okunur; doğrulanmamışsa rozetin
   yanındaki Doğrula ile doğrulama maili gönderilir (bağlantı afiet.co'daki
   sayfaya düşer, ekran odaklanınca rozet tazelenir). E-posta değiştirme de
   gerçek: ChangeEmailSheet iki adımlı akışla (yeni adrese doğrulama bağlantısı,
   dönüşte "Doğruladım") Stack'teki giriş adresini değiştirir. Şifre değiştirme
   gerçek (ChangePasswordSheet + AuthContext.changePassword); Apple ile gelen
   şifresiz kullanıcıda (hasPassword false) aynı satır "şifre belirle" moduna
   döner (sheet mode='set' + AuthContext.setPassword). Çıkış ve hesap silme de
   gerçek. Bu ekranda taslak (mock) kalmadı. */

export default function HesapScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const emerald = isDark ? '#34d399' : '#059669'
  const { api, signOut, deleteAuthUser, getStackUser, sendVerificationEmail } = useAuth()
  // Kullanıcı adı (backend profilinden); belirlenmemişse null. UsernameSheet
  // kaydınca notify('profiles') ile bu satır kendiliğinden tazelenir.
  const myUsername = useMyUsername()
  const [usernameOpen, setUsernameOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // E-posta ve şifre değiştirme gerçek formlarda; dört ayrı durum: e-posta
  // formu açık mı, e-posta değişti mi (satır altında sakin onay), şifre formu
  // açık mı, ve şifre işlemi bitti mi ('set' Apple'la gelen şifresiz
  // kullanıcının şifre BELİRLEMESİ, 'updated' normal değişiklik; metin ayrımı
  // için mod saklanır, boolean yetmez). E-posta ve şifre onayları ayrı
  // state'lerdir, aynı anda görünebilirler.
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailDone, setEmailDone] = useState(false)
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

  // Çıkış: token'ı atar, sonra login'e YÖNLENDİRİR. Bu ekran (Hesap ayarlarım)
  // sekmelerin DIŞINDA, root stack'te açıldığından (tabs)/_layout'taki anon
  // kapısı burada tetiklenmez; çıkışta ekran değişmezse kullanıcı boş/anon
  // hesap ekranında kalırdı. router.replace ile geçmiş de temizlenir (geri
  // tuşuyla korumalı ekrana dönülemez).
  const doSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  const doDelete = async () => {
    setDeleting(true)
    try {
      await api.deleteAccount() // backend: tüm veriyi kalıcı sil
      await deleteAuthUser() // best-effort: Stack Auth kimliğini de sil
      await signOut() // token'ı at; status → anon
      router.replace('/login') // hesap ekranı root stack'te → elle yönlendir
    } catch {
      setDeleting(false)
      Alert.alert(
        'Hesabını silemedik',
        'Şu anda işlemi tamamlayamadık. Biraz sonra tekrar deneyebilirsin.',
      )
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
      'Kayıtların, ölçülerin ve profilin dahil tüm verilerin kalıcı olarak silinir. Bu işlem geri alınamaz.',
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
          {/* Kullanıcı adı: @handle göster (yoksa sakin ipucu), dokununca aynı
              UsernameSheet'i "belirle/değiştir" moduyla açar (profildeki CTA ile
              tek sheet). */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={myUsername ? 'Kullanıcı adını değiştir' : 'Kullanıcı adı belirle'}
            onPress={() => setUsernameOpen(true)}
            className="flex-row items-center gap-3 px-4 py-4 active:bg-muted"
          >
            <IconUser size={22} color={emerald} />
            <View className="min-w-0 flex-1">
              <AppText weight="semibold" className="text-ink">
                Kullanıcı adı
              </AppText>
              {myUsername ? (
                <AppText numberOfLines={1} className="mt-0.5 shrink text-xs text-soft">
                  @{myUsername}
                </AppText>
              ) : (
                <AppText className="mt-0.5 text-xs text-soft">
                  Arkadaşların seni bu adla bulur
                </AppText>
              )}
            </View>
            <AppText weight="semibold" className="text-xs text-emerald-700 dark:text-emerald-300">
              {myUsername ? 'Değiştir' : 'Belirle'}
            </AppText>
            <IconChevronRight size={16} color={t.faint} />
          </Pressable>
          <View className="border-t border-line/40" />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setEmailDone(false)
              setEmailOpen(true)
            }}
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
          {/* E-posta değişince satır altında sakin onay (pwDone kutusunun deseni);
              e-posta ve şifre onayı aynı anda görünebilir. */}
          {emailDone ? (
            <View className="border-t border-line/40 bg-emerald-500/10 px-4 py-3">
              <AppText weight="semibold" className="text-sm text-emerald-700 dark:text-emerald-300">
                E-postan güncellendi
              </AppText>
              <AppText className="mt-0.5 text-xs text-soft">
                Bundan sonra girişte yeni adresini kullanacaksın.
              </AppText>
            </View>
          ) : null}
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

        <PushSettingsCard />

        {/* Oturum */}
        <View className="mt-4 rounded-2xl bg-surface p-5">
          <AppText weight="bold" className="mb-3 text-ink">
            Oturum
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => void doSignOut()}
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

      {/* Sheet'ler ekran kökünde, kaydırma alanının dışında (kök CLAUDE.md kuralı). */}
      <UsernameSheet
        open={usernameOpen}
        onClose={() => setUsernameOpen(false)}
        current={myUsername}
      />

      <ChangeEmailSheet
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        currentEmail={stackUser?.primaryEmail ?? null}
        onSuccess={() => {
          setEmailDone(true)
          // Satır yeni adresi ve Doğrulanmış rozetini göstersin diye profil
          // tazelenir (kaynak doğruluk Stack'te; sheet'in verdiği adres yerine
          // oradan okunur). Best-effort: okunamazsa sonraki odaklanmada tazelenir.
          void getStackUser()
            .then((u) => setStackUser(u))
            .catch(() => {})
        }}
      />

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
