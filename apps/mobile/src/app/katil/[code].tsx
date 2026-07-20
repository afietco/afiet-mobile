import { router, useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth/AuthContext'
import { useFtueSeen } from '@/features/ftue/ftueFlags'
import {
  groupInviteAuthParams,
  groupInviteDestination,
  normalizeInviteCode,
  normalizeInviteLabel,
} from '@/features/groups/inviteContext'
import { setPendingJoin } from '@/features/groups/pendingJoin'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'

/**
 * Group invitation entry point for afiet://katil/{code} and
 * https://afiet.co/katil/{code}. The HTTPS route is verified on iOS through
 * associatedDomains and AASA, and on Android through intentFilters and
 * assetlinks.json. The route stores the code in pendingJoin for the group
 * screen to consume, then sends authenticated users to the group screen. New
 * users keep the first-time experience before login, without losing the invite
 * context. Group membership rules and join errors remain owned by the group screen.
 */

const CODE_LENGTH = 8

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

export default function KatilRoute() {
  const { status } = useAuth()
  const welcomeIntroSeen = useFtueSeen('welcomeIntro')
  const firstValueCaptured = useFtueSeen('firstValueCaptured')
  const params = useLocalSearchParams<{
    code?: string | string[]
    groupName?: string | string[]
    inviterName?: string | string[]
  }>()
  const code = normalizeInviteCode(firstParam(params.code))
  const groupName = normalizeInviteLabel(firstParam(params.groupName))
  const inviterName = normalizeInviteLabel(firstParam(params.inviterName))
  const valid = code.length === CODE_LENGTH

  useEffect(() => {
    if (!valid) return

    const destination = groupInviteDestination(status, welcomeIntroSeen, firstValueCaptured)
    if (!destination) return

    const invite = { code, groupName, inviterName }
    const inviteParams = groupInviteAuthParams(invite)
    let active = true
    void setPendingJoin(code, invite).then(() => {
      if (!active) return
      if (destination === '/login') {
        router.replace({
          pathname: destination,
          params: { ...inviteParams, returnTo: '/grubum' },
        })
        return
      }
      if (destination === '/intro' || destination === '/first-meal') {
        router.replace({ pathname: destination, params: inviteParams })
        return
      }
      router.replace(destination)
    })
    return () => {
      active = false
    }
  }, [code, firstValueCaptured, groupName, inviterName, status, valid, welcomeIntroSeen])

  // Invalid invitations should show a calm explanation without redirecting.
  if (!valid) return <InvalidNotice />

  return <JoinSpinner />
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
