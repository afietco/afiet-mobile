import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Share, View, type TextStyle } from 'react-native'
import { ApiError, type ApiGroupInvite, type ApiGroupMember, type ApiGroupView } from '@/data/api/client'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconHeart, IconPencil, IconSparkles, IconTrash, IconUser } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'
import { groupErrorMessage, type UseGroups } from './useGroups'

/**
 * Grup detayı — listedeki satıra dokununca açılır: üye listesi, davet kodu
 * (native Paylaş), owner için satır içi ad düzenleme + üye çıkarma, herkes
 * için "Gruptan ayrıl". Sabit yükseklik (heightRatio): ad düzenlerken ve
 * davet kodu belirirken sheet zıplamasın.
 *
 * Ctx yerine props alır (GroupsCard'daki provider'la döngüsel import olmasın);
 * ad/üye değiştiren eylemler UseGroups üzerinden gider, liste özeti orada
 * kendiliğinden tazelenir.
 */

const NAME_MAX = 40

/** Davet kodunun geçerlilik notu (ör. "7 gün geçerli"). */
function expiryNote(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now()
  if (!Number.isFinite(ms) || ms <= 0) return 'süresi doldu'
  const days = Math.ceil(ms / 86_400_000)
  return `${days} gün geçerli`
}

async function shareInvite(groupName: string, code: string) {
  try {
    await Share.share({
      message:
        `afiet'te "${groupName}" grubuma katıl! 🍲\n\n` +
        `Davet kodu: ${code}\n\n` +
        `afiet'i aç, Profil › Gruplarım › "Koda katıl"a dokun ve kodu gir. afiet — sayma, dengele.`,
    })
  } catch {
    // paylaşım iptal edildi / paylaşılamadı — sessiz geç
  }
}

function MemberRow({
  member,
  isMe,
  canRemove,
  onRemove,
}: {
  member: ApiGroupMember
  isMe: boolean
  canRemove: boolean
  onRemove: () => void
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const trimmed = member.displayName?.trim()
  const name = trimmed || 'afiet üyesi'
  const initial = trimmed ? trimmed[0]?.toUpperCase() : null

  return (
    <View className="flex-row items-center gap-3 py-2.5">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-muted">
        {initial ? (
          <AppText weight="bold" className="text-soft">
            {initial}
          </AppText>
        ) : (
          <IconUser size={20} color={t.faint} />
        )}
      </View>
      <View className="min-w-0 flex-1">
        <AppText weight="semibold" numberOfLines={1} className="text-ink">
          {name}
          {isMe ? ' · sen' : ''}
        </AppText>
        {member.role === 'owner' ? <AppText className="text-xs text-soft">kurucu</AppText> : null}
      </View>
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

interface GroupDetailSheetProps {
  open: boolean
  /** Açılacak grubun id'si; kapalıyken null olabilir. */
  groupId: string | null
  myUserId: string | null
  groups: UseGroups
  onClose: () => void
}

export function GroupDetailSheet({ open, groupId, myUserId, groups, onClose }: GroupDetailSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  // grp nesnesi her render'da tazelenir; effect bağımlılıkları stabil kalsın
  // diye useCallback'li metodlar ayrıştırılır.
  const { getGroup, reload, renameGroup, leaveGroup, removeMember, createInvite } = groups

  const [view, setView] = useState<ApiGroupView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [invite, setInvite] = useState<ApiGroupInvite | null>(null)
  const [invBusy, setInvBusy] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState('')
  const [renameBusy, setRenameBusy] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)

  // Yarış koruması: yalnızca en son başlatılan yüklemenin sonucu yazılır.
  const runId = useRef(0)
  const load = useCallback(async () => {
    if (!groupId) return
    const id = ++runId.current
    setView(null)
    setError(null)
    try {
      const v = await getGroup(groupId)
      if (id === runId.current) setView(v)
    } catch (e) {
      if (id !== runId.current) return
      setError(groupErrorMessage(e, 'group'))
      // Üyelikten çıkarılmış olabiliriz — kartın listesini de tazele.
      if (e instanceof ApiError && e.status === 404) void reload()
    }
  }, [groupId, getGroup, reload])

  useEffect(() => {
    if (!open || !groupId) return
    setInvite(null)
    setRenaming(false)
    void load()
  }, [open, groupId, load])

  const isOwner = view?.myRole === 'owner'

  const startRename = () => {
    if (!view) return
    setDraft(view.group.name)
    setRenameError(null)
    setRenaming(true)
  }

  const saveRename = async () => {
    const trimmed = draft.trim()
    if (!groupId || !trimmed || trimmed.length > NAME_MAX || renameBusy) return
    setRenameBusy(true)
    setRenameError(null)
    try {
      setView(await renameGroup(groupId, trimmed))
      setRenaming(false)
    } catch (e) {
      setRenameError(groupErrorMessage(e, 'group'))
    } finally {
      setRenameBusy(false)
    }
  }

  const genInvite = async () => {
    if (!groupId || invBusy) return
    setInvBusy(true)
    void Haptics.selectionAsync()
    try {
      setInvite(await createInvite(groupId))
    } catch (e) {
      Alert.alert('Kod oluşturulamadı', groupErrorMessage(e, 'group'))
    } finally {
      setInvBusy(false)
    }
  }

  const confirmRemove = (m: ApiGroupMember) => {
    if (!groupId) return
    const name = m.displayName?.trim() || 'afiet üyesi'
    Alert.alert('Üyeyi çıkar?', `${name} gruptan çıkarılsın mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkar',
        style: 'destructive',
        onPress: () => {
          void removeMember(groupId, m.userId)
            .then(setView)
            .catch((e: unknown) => Alert.alert('Çıkarılamadı', groupErrorMessage(e, 'group')))
        },
      },
    ])
  }

  const confirmLeave = () => {
    if (!groupId || !view) return
    Alert.alert(
      'Gruptan ayrıl?',
      `"${view.group.name}" grubundan ayrılırsan üyeliğin sona erer. Dilediğin zaman yeni bir davet koduyla tekrar katılabilirsin.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Ayrıl',
          style: 'destructive',
          onPress: () => {
            if (!myUserId) {
              Alert.alert('Ayrılamadı', 'Oturumunu yenileyip tekrar dener misin?')
              return
            }
            void leaveGroup(groupId, myUserId)
              .then(onClose)
              .catch((e: unknown) => Alert.alert('Ayrılamadı', groupErrorMessage(e, 'group')))
          },
        },
      ],
    )
  }

  const renameInputStyle: TextStyle = {
    borderWidth: 2,
    borderColor: t.line,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: t.ink,
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      heightRatio={0.72}
      title={
        <>
          <IconHeart size={22} color={isDark ? '#34d399' : '#059669'} />
          <AppText weight="bold" numberOfLines={1} className="shrink text-lg text-ink">
            {view?.group.name ?? 'Grup'}
          </AppText>
          {isOwner && !renaming ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Grup adını düzenle"
              onPress={startRename}
              hitSlop={8}
              className="h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted"
            >
              <IconPencil size={14} color={t.soft} />
            </Pressable>
          ) : null}
        </>
      }
    >
      {!view && !error ? (
        <View className="items-center py-10">
          <ActivityIndicator color={isDark ? '#34d399' : '#059669'} />
        </View>
      ) : null}

      {error ? (
        <View className="py-4">
          <AppText className="mb-3 text-sm text-soft">{error}</AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => void load()}
            className="items-center rounded-xl bg-muted py-3"
          >
            <AppText weight="semibold" className="text-soft">
              Tekrar dene
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {view ? (
        <>
          {renaming ? (
            <View className="mb-4">
              <AppText weight="semibold" className="mb-2 text-sm text-soft">
                Grubun adı
              </AppText>
              <BottomSheetTextInput
                value={draft}
                onChangeText={(v) => {
                  setDraft(v)
                  if (renameError) setRenameError(null)
                }}
                placeholder="örn. Ailem"
                placeholderTextColor={t.faint}
                maxLength={NAME_MAX}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => void saveRename()}
                style={renameInputStyle}
              />
              {renameError ? (
                <AppText className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {renameError}
                </AppText>
              ) : null}
              <View className="mt-3 flex-row gap-2">
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setRenaming(false)}
                  className="flex-1 items-center rounded-xl bg-muted py-3"
                >
                  <AppText weight="semibold" className="text-soft">
                    Vazgeç
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void saveRename()}
                  disabled={!draft.trim() || renameBusy}
                  className={`flex-1 items-center rounded-xl bg-emerald-600 py-3 ${
                    !draft.trim() || renameBusy ? 'opacity-40' : ''
                  }`}
                >
                  <AppText weight="semibold" className="text-white">
                    {renameBusy ? 'Bir saniye…' : 'Kaydet'}
                  </AppText>
                </Pressable>
              </View>
            </View>
          ) : null}

          <AppText weight="semibold" className="mb-2 text-sm text-soft">
            Üyeler
          </AppText>
          <View className="rounded-xl border border-line px-3">
            {view.members.map((m, i) => (
              <View key={m.userId} className={i > 0 ? 'border-t border-line/60' : ''}>
                <MemberRow
                  member={m}
                  isMe={m.userId === myUserId}
                  canRemove={isOwner && m.userId !== myUserId}
                  onRemove={() => confirmRemove(m)}
                />
              </View>
            ))}
          </View>

          {invite ? (
            <View className="mt-4 items-center rounded-2xl border border-line bg-canvas p-4">
              <AppText className="text-xs text-soft">Davet kodu</AppText>
              <AppText
                weight="extrabold"
                className="my-1 text-ink"
                style={{ fontSize: 32, letterSpacing: 8 }}
              >
                {invite.code}
              </AppText>
              <AppText className="text-xs text-faint">{expiryNote(invite.expiresAt)}</AppText>
              <View className="mt-3 w-full flex-row gap-2">
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void shareInvite(view.group.name, invite.code)}
                  className="flex-1 items-center rounded-xl bg-emerald-600 py-3"
                >
                  <AppText weight="semibold" className="text-white">
                    Paylaş
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void genInvite()}
                  disabled={invBusy}
                  className={`items-center justify-center rounded-xl bg-muted px-4 py-3 ${
                    invBusy ? 'opacity-50' : ''
                  }`}
                >
                  <AppText weight="semibold" className="text-soft">
                    Yeni kod
                  </AppText>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => void genInvite()}
              disabled={invBusy}
              className={`mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 dark:bg-emerald-950/50 ${
                invBusy ? 'opacity-60' : ''
              }`}
            >
              <IconSparkles size={18} color={isDark ? '#34d399' : '#059669'} />
              <AppText weight="semibold" className="text-emerald-700 dark:text-emerald-300">
                {invBusy ? 'Oluşturuluyor…' : 'Davet kodu oluştur'}
              </AppText>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={confirmLeave}
            className="mt-2 items-center rounded-xl py-3"
          >
            <AppText weight="semibold" className="text-red-600 dark:text-red-400">
              Gruptan ayrıl
            </AppText>
          </Pressable>
        </>
      ) : null}
    </Sheet>
  )
}
