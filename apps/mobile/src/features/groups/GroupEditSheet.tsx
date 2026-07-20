import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useEffect, useRef, useState } from 'react'
import { Alert, Pressable, Switch, View, type TextStyle } from 'react-native'
import type { ApiGroupView } from '@/data/api/client'
import { track } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconGear, IconPencil } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'
import { GroupEmojiRow } from './GroupEmojiRow'
import { groupErrorMessage, type UseGroups } from './useGroups'

/**
 * Group settings sheet. Owners can edit identity, transfer ownership by
 * leaving a shared group, or delete a group when they are its only member.
 * Members can leave, and every destructive action requires confirmation.
 */

const NAME_MAX = 40

interface GroupEditSheetProps {
  open: boolean
  onClose: () => void
  view: ApiGroupView | null
  myUserId: string | null
  groups: UseGroups
  /** Ad değişince güncel görünümü sayfaya geri ver. */
  onSaved: (v: ApiGroupView) => void
  /** Görünürlük değişince sayfa görünümü tarihli GET ile tazelesin. */
  onReload: () => void
}

/** Sofra görünürlüğü satırı; enerji halkası + afiyet günleri TEK anahtarda.
    Backend'e yazar (group_members.sofra_visible); değişince görünüm tazelenir. */
function VisibilityRow({
  visible,
  busy,
  onChange,
}: {
  visible: boolean
  busy: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-canvas px-4 py-3">
      <View className="min-w-0 flex-1">
        <AppText weight="semibold" className="text-ink">
          Sofra görünürlüğüm
        </AppText>
        <AppText className="text-xs text-soft">
          Açıkken grup enerji halkanı ve afiyet günlerini görür; öğün detayın,
          kilon asla görünmez.
        </AppText>
      </View>
      <Switch
        value={visible}
        disabled={busy}
        onValueChange={onChange}
        trackColor={{ true: '#059669' }}
      />
    </View>
  )
}

/** Owner-only discovery visibility control. Public groups can be joined
 * without an invitation code. */
function PublicRow({
  isPublic,
  busy,
  onChange,
}: {
  isPublic: boolean
  busy: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-canvas px-4 py-3">
      <View className="min-w-0 flex-1">
        <AppText weight="semibold" className="text-ink">
          Herkese açık grup
        </AppText>
        <AppText className="text-xs text-soft">
          Açıkken grubun keşifte görünür; henüz grubu olmayanlar davet koduna gerek
          kalmadan katılabilir. Kapalıyken yalnızca davet koduyla katılınır.
        </AppText>
      </View>
      <Switch value={isPublic} disabled={busy} onValueChange={onChange} trackColor={{ true: '#059669' }} />
    </View>
  )
}

export function GroupEditSheet({
  open,
  onClose,
  view,
  myUserId,
  groups,
  onSaved,
  onReload,
}: GroupEditSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const groupId = view?.group.id ?? null
  const isOwner = view?.myRole === 'owner'
  const alone = view != null && view.members.length === 1
  const myVisible = view?.members.find((m) => m.userId === myUserId)?.sofraVisible ?? true

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [vizBusy, setVizBusy] = useState(false)
  const [pubBusy, setPubBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keşif görünürlüğü anlık yazılır (Kaydet'i beklemez): tek anahtarlık karar,
  // sofra görünürlüğüyle aynı dil. Görünümü PATCH cevabıyla DEĞİL onReload ile
  // tazeleriz; PATCH gövdesi week taşımaz, doğrudan uygulamak sayfadaki hafta
  // şeridini düşürürdü. Hata olursa anahtar eski değerine geri döner.
  const togglePublic = async (v: boolean) => {
    if (!groupId || pubBusy) return
    setPubBusy(true)
    try {
      await groups.updateGroup(groupId, { isPublic: v })
      track(v ? 'group_public_on' : 'group_public_off')
      onReload()
    } catch (e) {
      Alert.alert('Olmadı', groupErrorMessage(e, 'group'))
    } finally {
      setPubBusy(false)
    }
  }

  const toggleVisibility = async (v: boolean) => {
    if (!groupId || vizBusy) return
    setVizBusy(true)
    try {
      await groups.setMyVisibility(groupId, v)
      track(v ? 'sofra_visibility_on' : 'sofra_visibility_off')
      onReload()
    } catch (e) {
      Alert.alert('Olmadı', groupErrorMessage(e, 'group'))
    } finally {
      setVizBusy(false)
    }
  }

  // Her açılışta bir kez tohumla (açık formdaki girdiyi ezme).
  const seeded = useRef(false)
  useEffect(() => {
    if (!open) {
      seeded.current = false
      return
    }
    if (seeded.current || !view) return
    seeded.current = true
    setName(view.group.name)
    setEmoji(view.group.emoji)
    setBusy(false)
    setError(null)
  }, [open, view])

  const trimmed = name.trim()
  const valid = trimmed.length >= 1 && trimmed.length <= NAME_MAX

  const save = async () => {
    if (!view || !groupId || !valid || busy) return
    setBusy(true)
    setError(null)
    try {
      const patch: { name?: string; emoji?: string } = {}
      if (trimmed !== view.group.name) patch.name = trimmed
      if (emoji && emoji !== view.group.emoji) patch.emoji = emoji
      if (Object.keys(patch).length > 0) onSaved(await groups.updateGroup(groupId, patch))
      onClose()
    } catch (e) {
      setError(groupErrorMessage(e, 'group'))
      setBusy(false)
    }
  }

  const leaveOrDelete = (mode: 'leave' | 'delete') => {
    if (!view || !groupId) return
    const transfersOwnership = mode === 'leave' && isOwner
    const title =
      mode === 'delete'
        ? 'Grubu sil?'
        : transfersOwnership
          ? 'Kuruculuğu devredip ayrıl?'
          : 'Gruptan ayrıl?'
    const body =
      mode === 'delete'
        ? `"${view.group.name}" kalıcı olarak silinir. Bu işlem geri alınamaz.`
        : transfersOwnership
          ? `Kuruculuk gruptaki en eski üyeye devredilecek ve "${view.group.name}" grubundan ayrılacaksın.`
          : `"${view.group.name}" grubundan ayrılırsan üyeliğin sona erer. Davet koduyla dilediğin zaman tekrar katılabilirsin.`
    Alert.alert(title, body, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: mode === 'delete' ? 'Grubu sil' : 'Ayrıl',
        style: 'destructive',
        onPress: () => {
          if (mode === 'delete') {
            void groups
              .deleteGroup(groupId)
              .then(onClose)
              .catch((e: unknown) => Alert.alert('Silinemedi', groupErrorMessage(e, 'group')))
            return
          }
          if (!myUserId) {
            Alert.alert('Ayrılamadı', 'Oturumunu yenileyip tekrar dener misin?')
            return
          }
          void groups
            .leaveGroup(groupId, myUserId)
            .then(onClose)
            .catch((e: unknown) => Alert.alert('Ayrılamadı', groupErrorMessage(e, 'group')))
        },
      },
    ])
  }

  const inputStyle: TextStyle = {
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
      title={
        <>
          {isOwner ? (
            <IconPencil size={20} color={isDark ? '#34d399' : '#059669'} />
          ) : (
            <IconGear size={20} color={isDark ? '#34d399' : '#059669'} />
          )}
          <AppText weight="bold" className="text-lg text-ink">
            {isOwner ? 'Grubu düzenle' : 'Grup ayarları'}
          </AppText>
        </>
      }
    >
      {isOwner ? (
        <>
          <AppText weight="semibold" className="mb-2 text-sm text-soft">
            Logo
          </AppText>
          <GroupEmojiRow value={emoji} onChange={setEmoji} />

          <AppText weight="semibold" className="mb-2 mt-4 text-sm text-soft">
            Grubun adı
          </AppText>
          <BottomSheetTextInput
            value={name}
            onChangeText={(v) => {
              setName(v)
              if (error) setError(null)
            }}
            placeholder="örn. Ailem"
            placeholderTextColor={t.faint}
            maxLength={NAME_MAX}
            returnKeyType="done"
            onSubmitEditing={() => void save()}
            style={inputStyle}
          />
          {error ? (
            <AppText className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</AppText>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => void save()}
            disabled={!valid || busy}
            className={`mt-5 items-center rounded-xl bg-emerald-600 py-3.5 ${
              !valid || busy ? 'opacity-40' : ''
            }`}
          >
            <AppText weight="semibold" className="text-white">
              {busy ? 'Bir saniye…' : 'Kaydet'}
            </AppText>
          </Pressable>

          <View className="my-4 h-px bg-line/60" />

          <PublicRow
            isPublic={view?.group.isPublic ?? false}
            busy={pubBusy}
            onChange={(v) => void togglePublic(v)}
          />

          <View className="my-3" />

          <VisibilityRow visible={myVisible} busy={vizBusy} onChange={(v) => void toggleVisibility(v)} />

          <View className="my-4 h-px bg-line/60" />

          <Pressable
            accessibilityRole="button"
            onPress={() => leaveOrDelete(alone ? 'delete' : 'leave')}
            className="items-center rounded-xl bg-muted py-3.5"
          >
            <AppText weight="semibold" className="text-red-600 dark:text-red-400">
              {alone ? 'Grubu sil' : 'Kuruculuğu devredip ayrıl'}
            </AppText>
          </Pressable>
          {!alone ? (
            <AppText className="mt-2 text-center text-xs text-faint">
              Ayrıldığında kuruculuk gruptaki en eski üyeye devredilir.
            </AppText>
          ) : null}
        </>
      ) : (
        <>
          <AppText className="mb-4 text-sm text-soft">
            Logo ve adı grubun kurucusu düzenleyebilir.
          </AppText>
          <VisibilityRow visible={myVisible} busy={vizBusy} onChange={(v) => void toggleVisibility(v)} />
          <View className="my-4 h-px bg-line/60" />
          <Pressable
            accessibilityRole="button"
            onPress={() => leaveOrDelete('leave')}
            className="items-center rounded-xl bg-muted py-3.5"
          >
            <AppText weight="semibold" className="text-red-600 dark:text-red-400">
              Gruptan ayrıl
            </AppText>
          </Pressable>
        </>
      )}
    </Sheet>
  )
}
