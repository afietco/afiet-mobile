import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useEffect, useRef, useState } from 'react'
import { Alert, Pressable, View, type TextStyle } from 'react-native'
import type { ApiGroupView } from '@/data/api/client'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconGear, IconPencil } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'
import { GroupEmojiRow } from './GroupEmojiRow'
import { groupErrorMessage, type UseGroups } from './useGroups'

/**
 * Grup düzenleme pop-up'ı. Kurucu: logo + ad düzenler, grupta TEK KİŞİ
 * kaldıysa grubu silebilir (değilse buton soluk + açıklama). Üye: yalnızca
 * "Gruptan ayrıl" görür. Sil/ayrıl onayları Alert ile ikinci kez sorulur.
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
}

export function GroupEditSheet({ open, onClose, view, myUserId, groups, onSaved }: GroupEditSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const groupId = view?.group.id ?? null
  const isOwner = view?.myRole === 'owner'
  const alone = view != null && view.members.length === 1

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    const title = mode === 'delete' ? 'Grubu sil?' : 'Gruptan ayrıl?'
    const body =
      mode === 'delete'
        ? `"${view.group.name}" kalıcı olarak silinir. Bu işlem geri alınamaz.`
        : `"${view.group.name}" grubundan ayrılırsan üyeliğin sona erer. Grup ID'siyle dilediğin zaman tekrar katılabilirsin.`
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

          <Pressable
            accessibilityRole="button"
            onPress={() => leaveOrDelete('delete')}
            disabled={!alone}
            className={`items-center rounded-xl bg-muted py-3.5 ${!alone ? 'opacity-40' : ''}`}
          >
            <AppText weight="semibold" className="text-red-600 dark:text-red-400">
              Grubu sil
            </AppText>
          </Pressable>
          {!alone ? (
            <AppText className="mt-2 text-center text-xs text-faint">
              Grubu silebilmek için önce diğer üyeleri çıkarmalısın.
            </AppText>
          ) : null}
        </>
      ) : (
        <>
          <AppText className="mb-4 text-sm text-soft">
            Logo ve adı grubun kurucusu düzenleyebilir.
          </AppText>
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
