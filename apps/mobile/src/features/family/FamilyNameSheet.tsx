import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useEffect, useRef, useState } from 'react'
import { Pressable, type TextStyle } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconHeart } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'
import { familyErrorMessage } from './useFamily'

/**
 * Aile adı girişi — hem "Aile oluştur" hem de owner'ın "adı düzenle" akışında
 * kullanılır (mode). 1–40 karakter. Gönderim hata verirse sheet açık kalır ve
 * sıcak bir Türkçe mesaj gösterir.
 */

const MAX = 40

interface FamilyNameSheetProps {
  open: boolean
  mode: 'create' | 'rename'
  /** rename modunda mevcut ad; create modunda varsayılan öneri (ör. "Ailemiz"). */
  initialName?: string
  onClose: () => void
  onSubmit: (name: string) => Promise<void>
}

export function FamilyNameSheet({ open, mode, initialName, onClose, onSubmit }: FamilyNameSheetProps) {
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
    setName(initialName ?? '')
    setBusy(false)
    setError(null)
  }, [open, initialName])

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
      setError(familyErrorMessage(e, 'create'))
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
            {mode === 'create' ? 'Aile oluştur' : 'Aile adını düzenle'}
          </AppText>
        </>
      }
    >
      <AppText className="mb-3 text-sm text-soft">
        {mode === 'create'
          ? 'Ailene bir ad ver — sonra davet koduyla sevdiklerini çağırırsın.'
          : 'Ailenin görünen adını değiştir.'}
      </AppText>
      <BottomSheetTextInput
        value={name}
        onChangeText={(v) => {
          setName(v)
          if (error) setError(null)
        }}
        placeholder="Ailemiz"
        placeholderTextColor={t.faint}
        maxLength={MAX}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => void submit()}
        style={inputStyle}
      />
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
          {busy ? 'Bir saniye…' : mode === 'create' ? 'Aileyi oluştur' : 'Kaydet'}
        </AppText>
      </Pressable>
    </Sheet>
  )
}
