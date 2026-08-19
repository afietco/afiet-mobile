import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import { Pressable, View, type TextStyle } from 'react-native'
import { trackTap } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { Chip } from '@/ui/Chip'
import { IconHeart } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'
import { FormProblemNote, useFormGate, type FormProblem } from '@/ui/formGate'
import { fontFamilies } from '@/theme/fonts'
import { GroupEmojiRow } from './GroupEmojiRow'
import { groupErrorMessage } from './useGroups'

/**
 * Grup kurma; logo (emoji şeridi) + isim girişi (1–40 karakter) + hazır öneri
 * çipleri ("Ailem", "Arkadaşlarım"; dokununca isim ve; elle logo seçilmediyse ;
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
  onSubmit: (name: string, emoji: string | null, isPublic: boolean) => Promise<void>
}

/**
 * Who may come in, asked while the group is being made.
 *
 * The server has taken this since the endpoint existed and the app never sent
 * it, so every group ever created here was private and the only way to find
 * that out was to go looking for the setting afterwards. It is asked here
 * because it is the one decision that changes what the group IS, and because
 * "herkese açık" is what puts a group in front of somebody who has none.
 */
const VISIBILITY = [
  {
    open: false,
    label: 'Davetle',
    detail: 'Yalnız kodunu verdiğin kişiler katılabilir.',
  },
  {
    open: true,
    label: 'Herkese açık',
    detail: 'Grubu olmayanlar listede görüp katılabilir.',
  },
] as const

export function CreateGroupSheet({ open, onClose, onSubmit }: CreateGroupSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState<string | null>(null)
  // Elle seçilen logoyu öneri çipleri ezmesin.
  const [emojiTouched, setEmojiTouched] = useState(false)
  /* Davetle is the quiet answer, so it is the one that costs nothing to leave
     alone: a group that turns out to be public without being asked for is a
     surprise nobody can take back. */
  const [isPublic, setIsPublic] = useState(false)
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
    setIsPublic(false)
    setBusy(false)
    setError(null)
  }, [open])

  const trimmed = name.trim()
  const valid = trimmed.length >= 1 && trimmed.length <= MAX
  const gate = useFormGate()

  const nameProblem = (): FormProblem | null =>
    valid ? null : { message: 'Grubuna bir ad yazman gerekiyor.' }

  const submit = async () => {
    if (!valid || busy) return
    /* The far end of the create funnel: `group_create_open` counts who was
       offered the form, this counts who finished filling it in. The name and
       the emoji are the person's own words and stay out of it. */
    trackTap('group_create_submit')
    setBusy(true)
    setError(null)
    try {
      await onSubmit(trimmed, emoji, isPublic)
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
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    color: t.ink,
  }

  return (
    <Sheet
      name="create_group"
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
        Grubuna bir logo ve ad ver; sonra 8 karakterli davet kodunla sevdiklerini çağırırsın.
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
          gate.clear()
        }}
        placeholder="örn. Ailem"
        placeholderTextColor={t.faint}
        maxLength={MAX}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => gate.attempt(nameProblem, () => void submit())}
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
      <AppText weight="semibold" className="mb-2 mt-5 text-sm text-soft">
        Kimler katılabilsin?
      </AppText>
      <View className="gap-2">
        {VISIBILITY.map((option) => {
          const active = isPublic === option.open
          return (
            <Pressable
              key={option.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: busy }}
              disabled={busy}
              onPress={() => {
                void Haptics.selectionAsync()
                setIsPublic(option.open)
              }}
              className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3 active:opacity-80 ${
                active
                  ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/50'
                  : 'border-line bg-surface'
              }`}
            >
              <View
                className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                  active ? 'border-emerald-600 dark:border-emerald-500' : 'border-line'
                }`}
              >
                {active ? <View className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> : null}
              </View>
              <View className="min-w-0 flex-1">
                <AppText weight="bold" className="text-sm text-ink">
                  {option.label}
                </AppText>
                <AppText className="text-xs text-soft">{option.detail}</AppText>
              </View>
            </Pressable>
          )
        })}
      </View>
      <AppText className="mt-2 text-xs text-faint">
        Bunu sonra Grubum’dan değiştirebilirsin.
      </AppText>

      {error ? (
        <AppText className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</AppText>
      ) : null}

      <FormProblemNote problem={gate.problem} className="mt-3 mb-0" />

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          gate.attempt(nameProblem, () => void submit())
        }
        disabled={busy}
        className={`mt-5 items-center rounded-xl bg-emerald-600 py-3.5 ${busy ? 'opacity-40' : ''}`}
      >
        <AppText weight="semibold" className="text-white">
          {busy ? 'Bir saniye…' : 'Grubu kur'}
        </AppText>
      </Pressable>
    </Sheet>
  )
}
