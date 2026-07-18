import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth/AuthContext'
import { setPendingJoin } from '@/features/groups/pendingJoin'
import { AppText } from '@/ui/AppText'

/**
 * Grup daveti derin bağlantısı: afiet://katil/{code} (custom scheme) ve
 * https://afiet.co/katil/{code} (universal link, app.json associatedDomains +
 * afiet-web'in AASA dosyası) bu rotaya düşer. Kodu köprüye (pendingJoin)
 * bırakır; Grubum ekranı tüketip koda katılma akışını çalıştırır (bkz.
 * grubum.tsx). Girişliyse doğrudan Grubum'a, değilse önce girişe yönlendirir
 * (giriş sonrası kullanıcı Grubum'a vardığında katılım tamamlanır). Tek grup
 * kuralı ve hata mesajları katılmanın yapıldığı Grubum'da (useGroups +
 * groupErrorMessage) yönetilir; bu rota yalnız yönlendirici köprüdür.
 */

const LEN = 8
const normalize = (raw: string) =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, LEN)

export default function KatilRoute() {
  const { status } = useAuth()
  const params = useLocalSearchParams<{ code?: string | string[] }>()
  const raw = Array.isArray(params.code) ? (params.code[0] ?? '') : (params.code ?? '')
  const code = normalize(raw)
  const valid = code.length === LEN

  // Geçersiz kod: davetle bir yere zorlamadan sakin bilgi ver.
  if (!valid) return <InvalidNotice />

  // Geçerli kod köprüye bırakılır (Grubum tüketir). joinGroup'un kendi
  // durum güncellemesi ağ yanıtından SONRA çalıştığından, burada render
  // sırasında set etmek güvenlidir (senkron setState oluşmaz).
  setPendingJoin(code)

  // Oturum diskten çözülürken bekle; sonra karar ver.
  if (status === 'loading') return <JoinSpinner />

  // Girişliyse Grubum tüketir; girişsizse giriş sonrası Grubum'a varınca tüketir.
  return <Redirect href={status === 'authed' ? '/grubum' : '/login'} />
}

function JoinSpinner() {
  return (
    <View className="flex-1 items-center justify-center bg-canvas">
      <AppText weight="extrabold" className="mb-4 text-3xl text-emerald-600">
        afiet
      </AppText>
      <ActivityIndicator color="#059669" />
      <AppText className="mt-3 text-soft">Davetin hazırlanıyor…</AppText>
    </View>
  )
}

function InvalidNotice() {
  const insets = useSafeAreaInsets()
  return (
    <View
      className="flex-1 items-center justify-center bg-canvas px-8"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <AppText weight="extrabold" className="text-3xl text-emerald-600">
        afiet
      </AppText>
      <AppText weight="bold" className="mt-6 text-center text-xl text-ink">
        Bu bağlantı geçerli değil
      </AppText>
      <AppText className="mt-2 text-center text-soft">
        Davet kodu eksik ya da hatalı görünüyor. Grubu kuran kişiden davet
        bağlantısını yeniden paylaşmasını isteyebilirsin.
      </AppText>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace('/')}
        className="mt-8 items-center rounded-2xl bg-emerald-600 px-6 py-3.5 active:opacity-90"
      >
        <AppText weight="bold" className="text-white">
          Ana sayfaya dön
        </AppText>
      </Pressable>
    </View>
  )
}
