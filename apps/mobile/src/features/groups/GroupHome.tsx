import * as Haptics from 'expo-haptics'
import { Alert, Pressable, Share, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import type { ApiGroupMember, ApiGroupView } from '@/data/api/client'
import { SofframizCard } from '@/features/sofra/SofframizCard'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconCrown, IconGear, IconPencil, IconShare, IconTrash } from '@/ui/icons'
import { sendGreeting, sentToday, useGreetings } from './greetings'
import { MemberRing } from './MemberRing'
import { groupErrorMessage, type UseGroups } from './useGroups'

/**
 * Grubum — sayfa içi grup görünümü (tek grup modelinde detay pop-up değil,
 * sekmenin kendisidir). Kimlik kartında logo + ad + 8 haneli grup ID'si;
 * düzenleme ve sil/ayrıl GroupEditSheet pop-up'ında (sayfa dokunmaz).
 * Üye avatarlarının çevresinde 0'dan büyüyerek dolan enerji halkası —
 * oran backend'den gelir (energyRatio: günün kcal'i / hedef).
 */

/** Davet linki — afiet.co karşılama sayfası ID'yi uygulamaya taşıyacak. */
const inviteLink = (code: string) => `https://afiet.co/katil/${code}`

async function shareInvite(groupName: string, code: string) {
  try {
    await Share.share({
      message:
        `afiet'te "${groupName}" grubuma katıl! 🍲\n\n` +
        `Grup ID: ${code}\n` +
        `Davet linki: ${inviteLink(code)}\n\n` +
        `afiet'i aç, Grubum sekmesinde "ID ile katıl"a dokun ve ID'yi gir. afiet — sayma, dengele.`,
    })
  } catch {
    // paylaşım iptal edildi / paylaşılamadı — sessiz geç
  }
}

function MemberRow({
  member,
  groupId,
  isMe,
  canRemove,
  onRemove,
}: {
  member: ApiGroupMember
  groupId: string
  isMe: boolean
  canRemove: boolean
  onRemove: () => void
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const greetings = useGreetings()
  const trimmed = member.displayName?.trim()
  const name = trimmed || 'afiet üyesi'
  const initial = trimmed ? (trimmed[0]?.toUpperCase() ?? null) : null
  const ratio = member.energyRatio ?? 0
  // Görünürlüğü kapalı üyede halka yok, düz avatar + "gizli" (backend veriyi
  // zaten null gönderir — burada yalnız sunum kararı verilir).
  const hidden = !member.sofraVisible
  const afiyette = member.afiyetToday === true
  // Afiyet olsun: yalnız o gün afiyette olan, paylaşımı açık ve ben olmayan
  // üyeye; günde bir kez (aile-sofrasi.md).
  const canGreet = !isMe && !hidden && afiyette
  const greeted = sentToday(greetings, member.userId)

  const onGreet = () => {
    sendGreeting(groupId, member.userId)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  return (
    <View className="flex-row items-center gap-3 py-2.5">
      {hidden ? (
        <View className="h-12 w-12 items-center justify-center">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-muted">
            {member.emoji ? (
              <Text style={{ fontSize: 16, lineHeight: 20 }}>{member.emoji}</Text>
            ) : (
              <AppText weight="bold" className="text-sm text-soft">
                {initial ?? '·'}
              </AppText>
            )}
          </View>
        </View>
      ) : (
        <MemberRing emoji={member.emoji} initial={initial} ratio={ratio} />
      )}
      <View className="min-w-0 flex-1">
        <AppText weight="semibold" numberOfLines={1} className="text-ink">
          {name}
          {isMe ? ' · sen' : ''}
        </AppText>
        {member.role === 'owner' ? (
          <View className="flex-row items-center gap-1">
            <IconCrown size={12} color={isDark ? '#fbbf24' : '#d97706'} strokeWidth={2.2} />
            <AppText className="text-xs text-soft">kurucu</AppText>
          </View>
        ) : null}
        {afiyette ? (
          <AppText className="text-xs text-emerald-700 dark:text-emerald-300">
            bugün afiyetteydi ✨
          </AppText>
        ) : null}
      </View>
      {canGreet ? (
        greeted ? (
          <AppText className="text-xs text-faint">Afiyet olsun dedin ✓</AppText>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${name} için afiyet olsun de`}
            onPress={onGreet}
            hitSlop={6}
            className="shrink-0 rounded-full bg-emerald-100 px-3 py-1.5 dark:bg-emerald-900/60"
          >
            <AppText
              weight="bold"
              className="text-xs text-emerald-800 dark:text-emerald-200"
            >
              Afiyet olsun 🧡
            </AppText>
          </Pressable>
        )
      ) : null}
      {hidden ? (
        <AppText className="text-xs text-faint">gizli</AppText>
      ) : (
        <AppText weight="semibold" className="text-xs text-faint">
          %{Math.round(ratio * 100)}
        </AppText>
      )}
      {canRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${name} adlı üyeyi gruptan çıkar`}
          onPress={onRemove}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full"
        >
          <IconTrash size={18} color={isDark ? '#f87171' : '#dc2626'} />
        </Pressable>
      ) : null}
    </View>
  )
}

interface GroupHomeProps {
  view: ApiGroupView
  myUserId: string | null
  groups: UseGroups
  /** Üye çıkarma sonrası güncel görünümü sayfaya geri ver. */
  onViewChange: (v: ApiGroupView) => void
  /** Düzenleme pop-up'ını aç (sayfa kökünde durur). */
  onEdit: () => void
}

export function GroupHome({ view, myUserId, groups, onViewChange, onEdit }: GroupHomeProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const emoji = view.group.emoji
  const isOwner = view.myRole === 'owner'
  const code = view.group.code

  const confirmRemove = (m: ApiGroupMember) => {
    const name = m.displayName?.trim() || 'afiet üyesi'
    Alert.alert('Üyeyi çıkar?', `${name} gruptan çıkarılsın mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkar',
        style: 'destructive',
        onPress: () => {
          void groups
            .removeMember(view.group.id, m.userId)
            .then(onViewChange)
            .catch((e: unknown) => Alert.alert('Çıkarılamadı', groupErrorMessage(e, 'group')))
        },
      },
    ])
  }

  return (
    <Animated.View entering={FadeInDown.duration(250)}>
      {/* Kimlik kartı: logo + ad + grup ID */}
      <View className="rounded-2xl bg-surface p-5">
        <View className="flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/60">
            <Text style={{ fontSize: 34, lineHeight: 42 }}>{emoji ?? '🍲'}</Text>
          </View>
          <View className="min-w-0 flex-1">
            <AppText weight="extrabold" numberOfLines={1} className="text-lg text-ink">
              {view.group.name}
            </AppText>
            <AppText className="text-sm text-soft">
              {view.members.length} üye{isOwner ? ' · kurucususun' : ''}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Grup ID'sini paylaş"
              onPress={() => void shareInvite(view.group.name, code)}
              hitSlop={6}
              className="mt-1 self-start"
            >
              <AppText weight="bold" className="text-xs text-emerald-700 dark:text-emerald-300" style={{ letterSpacing: 2 }}>
                ID: {code}
              </AppText>
            </Pressable>
          </View>
          <View className="shrink-0 flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Davet linkini paylaş"
              onPress={() => void shareInvite(view.group.name, code)}
              className="h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60"
            >
              <IconShare size={18} color={isDark ? '#34d399' : '#059669'} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isOwner ? 'Grubu düzenle' : 'Grup ayarları'}
              onPress={onEdit}
              className="h-10 w-10 items-center justify-center rounded-full bg-muted"
            >
              {isOwner ? (
                <IconPencil size={18} color={t.soft} />
              ) : (
                <IconGear size={18} color={t.soft} />
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Soframız: ortak haftalık hedef (kişi kırılımı yok, date'li GET'ten) */}
      {view.week ? (
        <SofframizCard week={view.week} memberCount={view.members.length} />
      ) : null}

      {/* Üyeler: enerji halkalı avatarlar */}
      <View className="mt-4 rounded-2xl bg-surface p-5">
        <AppText weight="bold" className="mb-1 text-ink">
          Üyeler
        </AppText>
        <View>
          {view.members.map((m, i) => (
            <View key={m.userId} className={i > 0 ? 'border-t border-line/60' : ''}>
              <MemberRow
                member={m}
                groupId={view.group.id}
                isMe={m.userId === myUserId}
                canRemove={isOwner && m.userId !== myUserId}
                onRemove={() => confirmRemove(m)}
              />
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  )
}
