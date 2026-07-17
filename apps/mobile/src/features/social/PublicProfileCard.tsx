import * as Haptics from 'expo-haptics'
import { useSyncExternalStore } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { MemberRing } from '@/features/groups/MemberRing'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
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

/** Sınırlı vücut/beslenme bağlamı satırı (varsa), "Kadın · 164 cm · orta". */
function bodyLine(p: SocialProfile): string | null {
  const parts: string[] = []
  if (p.sex) parts.push(SEX_TR[p.sex])
  if (typeof p.heightCm === 'number') parts.push(`${p.heightCm} cm`)
  if (p.activityLevel) parts.push(p.activityLevel)
  return parts.length ? parts.join(' · ') : null
}

/** Küçük, dokunulamaz rozet pill'i. */
function Badge({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-canvas px-3 py-1">
      <AppText className="text-xs text-soft">{label}</AppText>
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
  const initial = profile.displayName.trim()
    ? (profile.displayName.trim()[0]?.toUpperCase() ?? null)
    : null
  const body = bodyLine(profile)

  const badges: string[] = []
  if (profile.groupName) badges.push(profile.groupName)
  if (profile.afiyetWeeks > 0) badges.push(`${profile.afiyetWeeks} afiyet haftası`)
  if (profile.afiyetToday) badges.push('bugün afiyette ✨')

  return (
    <View className="items-center pb-2">
      <MemberRing emoji={profile.emoji} initial={initial} ratio={profile.energyRatio} size={96} />

      <AppText weight="extrabold" className="mt-4 text-xl text-ink">
        {profile.displayName}
      </AppText>
      {profile.username ? (
        <AppText className="mt-0.5 text-sm text-soft">@{profile.username}</AppText>
      ) : null}

      {badges.length ? (
        <View className="mt-4 flex-row flex-wrap items-center justify-center gap-2">
          {badges.map((b) => (
            <Badge key={b} label={b} />
          ))}
        </View>
      ) : null}

      {body ? <AppText className="mt-3 text-xs text-faint">{body}</AppText> : null}

      <View className="w-full">
        <StatusButton profile={profile} />
      </View>
    </View>
  )
}

/* ── Kök host (app/_layout.tsx'te bir kez mount edilir) ───────────────────── */

/**
 * Uygulama kökünde yaşayan tek profil sheet'i. openPublicProfile(userId) ile
 * açılır; içerik useSocialProfile ile gerçek backend'den çekilir ve depoya
 * abonedir (arkadaş ekleyince buton durumu anında güncellenir). Çekiliş
 * sürerken sakin bir bekleyiş gösterilir.
 */
export function PublicProfileHost() {
  const { isDark } = useTheme()
  const userId = useOpenId()
  const { profile, loading } = useSocialProfile(userId ?? '')

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
        <AppText className="py-6 text-center text-sm text-faint">
          Bu profil şu an görüntülenemiyor.
        </AppText>
      )}
    </Sheet>
  )
}
