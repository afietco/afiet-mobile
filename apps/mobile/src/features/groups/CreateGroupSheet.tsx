import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import { Pressable, View, type TextStyle } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { Chip } from '@/ui/Chip'
import { IconHeart } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'
import { groupErrorMessage } from './useGroups'

/**
 * Grup kurma — isim girişi (1–40 karakter) + hazır öneri çipleri ("Ailem",
 * "Arkadaşlarım"; dokununca inputu doldurur, kullanıcı düzenleyebilir).
 * Gönderim hata verirse sheet açık kalır ve sıcak bir Türkçe mesaj gösterir.
 */

const MAX = 40
const SUGGESTIONS = ['Ailem', 'Arkadaşlarım'] as const

interface CreateGroupSheetProps {
  open: boolean
  onClose: () => void
  onSubmit: (name: string) => Promise<void>
}

export function CreateGroupSheet({ open, onClose, onSubmit }: CreateGroupSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [name, setName] = useState('')
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
      await onSubmit(trimmed)
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
        Grubuna bir ad ver — sonra davet koduyla sevdiklerini çağırırsın.
      </AppText>
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
            key={s}
            label={s}
            active={trimmed === s}
            onPress={() => {
              void Haptics.selectionAsync()
              setName(s)
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
