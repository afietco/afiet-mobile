import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth/AuthContext'
import { setPendingJoin } from '@/features/groups/pendingJoin'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'

/**
 * Group invitation entry point for afiet://katil/{code} and
 * https://afiet.co/katil/{code}. The HTTPS route is verified on iOS through
 * associatedDomains and AASA, and on Android through intentFilters and
 * assetlinks.json. The route stores the code in pendingJoin for the group
 * screen to consume, then sends authenticated users to the group screen and
 * unauthenticated users through login first. Group membership rules and join
 * errors remain owned by the group screen.
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

  // Invalid invitations should show a calm explanation without redirecting.
  if (!valid) return <InvalidNotice />

  // The group screen consumes this bridge value. joinGroup updates React state
  // only after the network response, so this synchronous store write is safe.
  setPendingJoin(code)

  // Wait for the persisted session before choosing the destination.
  if (status === 'loading') return <JoinSpinner />

  // Unauthenticated users complete the same handoff after signing in.
  return <Redirect href={status === 'authed' ? '/grubum' : '/login'} />
}

function JoinSpinner() {
  return (
    <View className="flex-1 items-center justify-center bg-canvas">
      <AppText weight="extrabold" className="mb-4 text-3xl text-emerald-600">
        afiet
      </AppText>
      <AfiPose pose="temel" motion="yukleniyor" size={96} />
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
      <View className="mt-6">
        <AfiPose pose="oops" size={104} />
      </View>
      <AppText weight="bold" className="mt-2 text-center text-xl text-ink">
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
