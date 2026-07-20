import { ACTIVITY_LEVELS } from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { usePathname } from 'expo-router'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { useGroups } from '@/features/groups/useGroups'
import { MemberRing } from '@/features/groups/MemberRing'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'
import { Sheet } from '@/ui/Sheet'
import { acceptRequest, sendFriendRequest, useFriendRequests, useSocialProfile } from './store'
import type { SocialProfile } from './types'

/**
 * Başkasının profilini gösteren ORTAK kart, arkadaşlar ve grup keşfi
 * ekranlarının paylaştığı tek görünüm. Bir Sheet içinde enerji halkası,
 * @kullanıcı adı, rozetler ve arkadaşlık durumuna göre buton.
 *
 * AÇMA MEKANİZMASI: tek global sheet + modül fonksiyonu (ekran ajanları
 * için en temizi). Herhangi bir satırdan `openPublicProfile(userId)` çağır;
 * kart ekran kökündeki <PublicProfileHost/> içinde açılır. Kapatma
 * `closePublicProfile()` ya da sheet'in kendi kapatması ile. Ekranların
 * open/onClose state'i taşıması gerekmez.
 *
 * <PublicProfileHost/> uygulama kökünde (app/_layout.tsx) BİR KEZ mount edilir.
 */

/* ── Global açık-profil deposu (useSyncExternalStore) ─────────────────────── */

let openId: string | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

/** Bir kullanıcının herkese açık profilini aç (her ekrandan çağrılabilir). */
export function openPublicProfile(userId: string) {
  openId = userId
  emit()
}

/** Açık profil kartını kapat. */
export function closePublicProfile() {
  if (openId === null) return
  openId = null
  emit()
}

function useOpenId(): string | null {
  return useSyncExternalStore(subscribe, () => openId)
}

/* ── Rozet + durum yardımcıları ───────────────────────────────────────────── */

const SEX_TR: Record<'male' | 'female', string> = { male: 'Erkek', female: 'Kadın' }

/** Aktivite anahtarını okunur etikete çevir ("orta" → "Orta"); tanınmazsa ham. */
function activityLabel(key: string): string {
  return ACTIVITY_LEVELS.find((a) => a.key === key)?.label ?? key
}

/** Sınırlı vücut/beslenme bağlamı satırı (varsa), "Kadın · 164 cm · Orta". */
function bodyLine(p: SocialProfile): string | null {
  const parts: string[] = []
  if (p.sex) parts.push(SEX_TR[p.sex])
  if (typeof p.heightCm === 'number') parts.push(`${p.heightCm} cm`)
  if (p.activityLevel) parts.push(activityLabel(p.activityLevel))
  return parts.length ? parts.join(' · ') : null
}

/** Küçük, dokunulamaz rozet pill'i; warm tonu afiyet vurgusu için. */
function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'warm' }) {
  const warm = tone === 'warm'
  return (
    <View
      className={`rounded-full px-3.5 py-2 ${
        warm ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-canvas'
      }`}
    >
      <AppText
        weight={warm ? 'semibold' : 'normal'}
        className={`text-sm ${warm ? 'text-emerald-700 dark:text-emerald-300' : 'text-soft'}`}
      >
        {label}
      </AppText>
    </View>
  )
}

/* ── Durum butonu ─────────────────────────────────────────────────────────── */

function StatusButton({ profile }: { profile: SocialProfile }) {
  const { incoming } = useFriendRequests()

  const onAdd = () => {
    sendFriendRequest(profile.userId)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const onAccept = () => {
    const req = incoming.find((r) => r.userId === profile.userId)
    if (!req) return
    acceptRequest(req.id)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  switch (profile.friendStatus) {
    case 'self':
      return null
    case 'none':
      return (
        <Pressable
          accessibilityRole="button"
          onPress={onAdd}
          className="mt-5 items-center rounded-xl bg-emerald-600 py-3.5 active:opacity-80"
        >
          <AppText weight="semibold" className="text-white">
            Arkadaş ekle
          </AppText>
        </Pressable>
      )
    case 'incoming':
      return (
        <Pressable
          accessibilityRole="button"
          onPress={onAccept}
          className="mt-5 items-center rounded-xl bg-emerald-600 py-3.5 active:opacity-80"
        >
          <AppText weight="semibold" className="text-white">
            İsteği kabul et
          </AppText>
        </Pressable>
      )
    case 'outgoing':
      return (
        <View className="mt-5 items-center rounded-xl bg-muted py-3.5">
          <AppText weight="semibold" className="text-soft">
            İstek gönderildi
          </AppText>
        </View>
      )
    case 'friends':
      return (
        <View className="mt-5 items-center rounded-xl bg-muted py-3.5">
          <AppText weight="semibold" className="text-soft">
            Arkadaşsınız
          </AppText>
        </View>
      )
  }
}

/* ── Kart içeriği ─────────────────────────────────────────────────────────── */

function ProfileContent({ profile }: { profile: SocialProfile }) {
  // Relationship badges must use stable identity because group names are not unique.
  const { state } = useGroups()
  const myGroupId = state.status === 'ready' ? (state.groups[0]?.id ?? null) : null

  const initial = profile.displayName.trim()
    ? (profile.displayName.trim()[0]?.toUpperCase() ?? null)
    : null

  const isFriend = profile.friendStatus === 'friends'
  const sameGroup = !!myGroupId && !!profile.groupId && myGroupId === profile.groupId
  // Limited body and energy context is visible only to friends or group peers.
  const connected = isFriend || sameGroup
  const relationship = isFriend ? 'sofra arkadaşın' : sameGroup ? 'grubundan' : null

  const body = bodyLine(profile)
  const energyPct =
    profile.energyRatio === null ? null : Math.round(profile.energyRatio * 100)

  const badges: { label: string; tone: 'neutral' | 'warm' }[] = []
  if (profile.groupName) badges.push({ label: `🍲 ${profile.groupName}`, tone: 'neutral' })
  if (profile.afiyetWeeks > 0)
    badges.push({ label: `${profile.afiyetWeeks} afiyet haftası`, tone: 'neutral' })
  if (profile.afiyetToday) badges.push({ label: 'bugün afiyette ✨', tone: 'warm' })

  return (
    <View className="items-center pb-2">
      <MemberRing emoji={profile.emoji} initial={initial} ratio={profile.energyRatio} size={96} />

      <AppText weight="extrabold" className="mt-4 text-xl text-ink">
        {profile.displayName}
      </AppText>
      {profile.username ? (
        <AppText className="mt-0.5 text-sm text-soft">@{profile.username}</AppText>
      ) : null}

      {relationship ? (
        <View className="mt-2 rounded-full bg-emerald-100 px-3 py-1 dark:bg-emerald-900/50">
          <AppText weight="semibold" className="text-xs text-emerald-700 dark:text-emerald-300">
            {relationship}
          </AppText>
        </View>
      ) : null}

      {badges.length ? (
        <View className="mt-4 flex-row flex-wrap items-center justify-center gap-2">
          {badges.map((b) => (
            <Badge key={b.label} label={b.label} tone={b.tone} />
          ))}
        </View>
      ) : null}

      {/* Limited body and daily energy context for connected profiles. */}
      {connected && (body || profile.afiyetToday) ? (
        <View className="mt-4 w-full items-center border-t border-line/50 pt-4">
          {body ? <AppText className="text-sm text-soft">{body}</AppText> : null}
          {profile.afiyetToday && energyPct !== null ? (
            <AppText className="mt-1 text-xs text-faint">bugünün enerjisi %{energyPct}</AppText>
          ) : null}
        </View>
      ) : null}

      <View className="w-full">
        <StatusButton profile={profile} />
      </View>
    </View>
  )
}

/* ── Root host, mounted once from app/_layout.tsx ─────────────────────────── */

/**
 * Global public-profile sheet backed by the live social store. Route changes
 * close it so the overlay cannot remain above the next screen.
 */
export function PublicProfileHost() {
  const { isDark } = useTheme()
  const pathname = usePathname()
  const previousPathname = useRef(pathname)
  const userId = useOpenId()
  const { profile, loading } = useSocialProfile(userId ?? '')

  useEffect(() => {
    if (previousPathname.current !== pathname) closePublicProfile()
    previousPathname.current = pathname
  }, [pathname])

  return (
    <Sheet
      open={userId !== null}
      onClose={closePublicProfile}
      title={
        <AppText weight="bold" className="text-lg text-ink">
          Profil
        </AppText>
      }
    >
      {loading ? (
        <View className="items-center py-10">
          <ActivityIndicator color={isDark ? '#34d399' : '#059669'} />
        </View>
      ) : profile ? (
        <ProfileContent profile={profile} />
      ) : (
        <View className="items-center py-4">
          <AfiPose pose="oops" size={76} />
          <AppText className="mt-2 text-center text-sm text-faint">
            Bu profil şu an görüntülenemiyor.
          </AppText>
        </View>
      )}
    </Sheet>
  )
}
