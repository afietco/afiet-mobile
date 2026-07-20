import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import { Pressable, View, type TextStyle } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { Chip } from '@/ui/Chip'
import { IconHeart } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'
import { GroupEmojiRow } from './GroupEmojiRow'
import { groupErrorMessage } from './useGroups'

/**
 * Grup kurma — logo (emoji şeridi) + isim girişi (1–40 karakter) + hazır öneri
 * çipleri ("Ailem", "Arkadaşlarım"; dokununca isim ve — elle logo seçilmediyse —
 * eşleşen logoyu doldurur). Gönderim hata verirse sheet açık kalır ve sıcak bir
 * Türkçe mesaj gösterir. Logo seçilmezse null gider; grup id'den türeyen
 * deterministik varsayılan devreye girer (groupEmoji.ts).
 */

const MAX = 40
const SUGGESTIONS = [
  { name: 'Ailem', emoji: '👨‍👩‍👧‍👦' },
  { name: 'Arkadaşlarım', emoji: '🫶' },
] as const

interface CreateGroupSheetProps {
  open: boolean
  onClose: () => void
  onSubmit: (name: string, emoji: string | null) => Promise<void>
}

export function CreateGroupSheet({ open, onClose, onSubmit }: CreateGroupSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState<string | null>(null)
  // Elle seçilen logoyu öneri çipleri ezmesin.
  const [emojiTouched, setEmojiTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Her açılışta bir kez tohumla (açık formdaki girdiyi ezme).
  const seeded = useRef(false)
  useEffect(() => {
    if (!open) {
      seeded.current = false
      return
    }
    if (seeded.current) return
    seeded.current = true
    setName('')
    setEmoji(null)
    setEmojiTouched(false)
    setBusy(false)
    setError(null)
  }, [open])

  const trimmed = name.trim()
  const valid = trimmed.length >= 1 && trimmed.length <= MAX

  const submit = async () => {
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    try {
      await onSubmit(trimmed, emoji)
      onClose()
    } catch (e) {
      setError(groupErrorMessage(e, 'generic'))
      setBusy(false)
    }
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
          <IconHeart size={22} color={isDark ? '#34d399' : '#059669'} />
          <AppText weight="bold" className="text-lg text-ink">
            Grup kur
          </AppText>
        </>
      }
    >
      <AppText className="mb-3 text-sm text-soft">
        Grubuna bir logo ve ad ver — sonra 8 karakterli davet kodunla sevdiklerini çağırırsın.
      </AppText>
      <View className="mb-3">
        <GroupEmojiRow
          value={emoji}
          onChange={(e) => {
            setEmoji(e)
            setEmojiTouched(true)
          }}
        />
      </View>
      <BottomSheetTextInput
        value={name}
        onChangeText={(v) => {
          setName(v)
          if (error) setError(null)
        }}
        placeholder="örn. Ailem"
        placeholderTextColor={t.faint}
        maxLength={MAX}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => void submit()}
        style={inputStyle}
      />
      <View className="mt-3 flex-row flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <Chip
            key={s.name}
            label={`${s.emoji} ${s.name}`}
            active={trimmed === s.name}
            onPress={() => {
              void Haptics.selectionAsync()
              setName(s.name)
              if (!emojiTouched) setEmoji(s.emoji)
              if (error) setError(null)
            }}
          />
        ))}
      </View>
      {error ? (
        <AppText className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</AppText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => void submit()}
        disabled={!valid || busy}
        className={`mt-5 items-center rounded-xl bg-emerald-600 py-3.5 ${
          !valid || busy ? 'opacity-40' : ''
        }`}
      >
        <AppText weight="semibold" className="text-white">
          {busy ? 'Bir saniye…' : 'Grubu kur'}
        </AppText>
      </Pressable>
    </Sheet>
  )
}
