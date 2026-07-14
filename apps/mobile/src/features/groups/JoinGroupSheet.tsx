import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useEffect, useRef, useState } from 'react'
import { Pressable, type TextStyle } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconSparkles } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'
import { groupErrorMessage } from './useGroups'

/**
 * Davet koduyla katılma — büyük punto, otomatik büyük harf, 6 karakterlik kod.
 * 404 (kod yok) / 410 (süresi dolmuş) / 409 (o gruba zaten üye) sıcak Türkçe
 * mesaja çevrilir; başarıda haptik hook'ta verilir.
 */

const LEN = 6
/** Kart formatı: yalnız harf/rakam, büyük harf, en fazla 6. */
const normalize = (raw: string) =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, LEN)

interface JoinGroupSheetProps {
  open: boolean
  onClose: () => void
  onJoin: (code: string) => Promise<void>
}

export function JoinGroupSheet({ open, onClose, onJoin }: JoinGroupSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const seeded = useRef(false)
  useEffect(() => {
    if (!open) {
      seeded.current = false
      return
    }
    if (seeded.current) return
    seeded.current = true
    setCode('')
    setBusy(false)
    setError(null)
  }, [open])

  const valid = code.length === LEN

  const submit = async () => {
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    try {
      await onJoin(code)
      onClose()
    } catch (e) {
      setError(groupErrorMessage(e, 'join'))
      setBusy(false)
    }
  }

  const inputStyle: TextStyle = {
    borderWidth: 2,
    borderColor: valid ? '#10b981' : t.line,
    borderRadius: 16,
    paddingVertical: 18,
    textAlign: 'center',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 34,
    letterSpacing: 10,
    color: t.ink,
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <>
          <IconSparkles size={22} color={isDark ? '#34d399' : '#059669'} />
          <AppText weight="bold" className="text-lg text-ink">
            Davet koduyla katıl
          </AppText>
        </>
      }
    >
      <AppText className="mb-3 text-sm text-soft">
        Gruptan aldığın 6 haneli kodu gir — sofraya birlikte oturalım.
      </AppText>
      <BottomSheetTextInput
        value={code}
        onChangeText={(v) => {
          setCode(normalize(v))
          if (error) setError(null)
        }}
        placeholder="ABC123"
        placeholderTextColor={t.faint}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        maxLength={LEN}
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
          {busy ? 'Katılıyorsun…' : 'Gruba katıl'}
        </AppText>
      </Pressable>
    </Sheet>
  )
}
