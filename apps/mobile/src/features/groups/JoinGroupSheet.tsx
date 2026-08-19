import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useEffect, useRef, useState } from 'react'
import { Pressable, type TextStyle } from 'react-native'
import { trackTap } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconSparkles } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'
import { FormProblemNote, useFormGate, type FormProblem } from '@/ui/formGate'
import { fontFamilies } from '@/theme/fonts'
import { groupErrorMessage } from './useGroups'

/** Joins a group with its permanent eight-character invitation code. */

const LEN = 8
/** Keeps only uppercase ASCII letters and digits, capped at eight characters. */
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
  const gate = useFormGate()

  const codeProblem = (): FormProblem | null => {
    if (valid) return null
    return {
      message:
        code.length === 0
          ? 'Davet kodunu yazman gerekiyor.'
          : 'Davet kodu 8 karakter; birkaç karakter eksik görünüyor.',
    }
  }

  const submit = async () => {
    if (!valid || busy) return
    trackTap('group_join_submit', { via: 'code' })
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
    fontFamily: fontFamilies.extrabold,
    fontSize: 28,
    letterSpacing: 6,
    color: t.ink,
  }

  return (
    <Sheet
      name="join_group"
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
        Grubun 8 karakterli davet kodunu gir; sofraya birlikte oturalım.
      </AppText>
      <BottomSheetTextInput
        value={code}
        onChangeText={(v) => {
          setCode(normalize(v))
          if (error) setError(null)
          gate.clear()
        }}
        placeholder="AB12CD34"
        placeholderTextColor={t.faint}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        maxLength={LEN}
        returnKeyType="done"
        onSubmitEditing={() => gate.attempt(codeProblem, () => void submit())}
        style={inputStyle}
      />
      {error ? (
        <AppText className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</AppText>
      ) : null}

      <AppText className="mt-3 text-xs text-faint">
        Katılınca grup enerji halkanı ve afiyet günlerini görebilir; istersen
        Grubum'dan kapatırsın. Öğün detayın ve kilon asla görünmez.
      </AppText>

      <FormProblemNote problem={gate.problem} className="mt-3 mb-0" />

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          gate.attempt(codeProblem, () => void submit())
        }
        disabled={busy}
        className={`mt-5 items-center rounded-xl bg-emerald-600 py-3.5 ${busy ? 'opacity-40' : ''}`}
      >
        <AppText weight="semibold" className="text-white">
          {busy ? 'Katılıyorsun…' : 'Gruba katıl'}
        </AppText>
      </Pressable>
    </Sheet>
  )
}
