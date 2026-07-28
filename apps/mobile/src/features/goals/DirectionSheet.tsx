import {
  GOAL_DIRECTIONS,
  formatLongTR,
  goalDirectionMeta,
  type GoalDirection,
} from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconCheck, IconChevronRight, IconTarget } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { Sheet } from '@/ui/Sheet'
import { useGoalDirection } from './useGoalDirection'

/**
 * "Yönüm": Afi asks one question, and an answer is a tap.
 *
 * This used to be a list of five radio rows on a screen of its own. It is one
 * question, so it is asked the way a question is asked: Afi is present, the
 * five answers are cards big enough to read in one glance, and choosing one
 * commits it. There is no confirm button, because there is nothing to confirm.
 *
 * The sentences come from the engine's direction table verbatim. They describe
 * how someone wants to feel and never name weight, so this sheet quotes them
 * rather than rewording them (docs/hedeflerim.md, sections 3 and 12).
 *
 * A choice never lands today. Every state of the sheet names the Monday it
 * starts on: before the tap as a standing promise, after it as Afi's answer,
 * so nobody walks away thinking their measures just moved under their feet
 * (section 7).
 *
 * Someone who has never chosen runs on the silent `duzen` default. No card is
 * marked for them: the default is real, but it is ours, not theirs.
 */

const QUESTION = 'Ölçülerini neye göre kurayım?'
const INVITE = 'Sana en yakın gelene dokunman yeterli. Gerisini ben kurarım 🌿'
const DEFAULT_NOTE = 'Şu an dengede tutuyorum; hazır olduğunda bana bir yön söyleyebilirsin.'
const SAVE_ERROR = 'Yönünü kaydedemedim. Bağlantını kontrol edip tekrar dener misin?'
const LOAD_ERROR = 'Yönünü şu an okuyamadım; şimdilik dengede tutuyorum.'

/** How long Afi's answer stays up before the sheet shows itself out. */
const ACKNOWLEDGEMENT_MS = 2400
/** The stage box around Afi; the glow needs room to fall off to nothing. */
const STAGE = 132
const AFI_SIZE = 104

interface Acknowledgement {
  direction: GoalDirection
  /** YYYY-MM-DD, the Monday the choice starts on. */
  effectiveFrom: string
}

export interface DirectionSheetProps {
  open: boolean
  onClose: () => void
  /** Fires once the choice is stored, before the sheet shows itself out. */
  onChosen?: (direction: GoalDirection) => void
}

/**
 * Sheets are positioned absolutely, so this belongs at the screen root, outside
 * every scroll container (CLAUDE.md sheet rules). `DirectionRow` is the doorway
 * that goes inside the page.
 */
export function DirectionSheet({ open, onClose, onChosen }: DirectionSheetProps) {
  const { isDark } = useTheme()
  const violet = isDark ? '#a78bfa' : '#7c3aed'
  const { direction, isDefault, pending, startsOn, choose, loading, error } = useGoalDirection()

  const [savingKey, setSavingKey] = useState<GoalDirection | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [acknowledged, setAcknowledged] = useState<Acknowledgement | null>(null)

  // Every opening is a fresh question; the last answer must not greet the next.
  useEffect(() => {
    if (open) {
      setAcknowledged(null)
      setSaveError(null)
    }
  }, [open])

  useEffect(() => {
    if (!acknowledged) return
    const timer = setTimeout(onClose, ACKNOWLEDGEMENT_MS)
    return () => clearTimeout(timer)
  }, [acknowledged, onClose])

  /* The latest choice is what the cards show as chosen, even before it starts.
     While one is being stored it is shown as chosen too, so the tap answers
     immediately instead of waiting for the network. */
  const chosen: GoalDirection | null =
    savingKey ?? pending?.direction ?? (isDefault ? null : direction)

  const pick = useCallback(
    async (next: GoalDirection) => {
      if (savingKey) return
      void Haptics.selectionAsync()
      // Re-picking the direction that is already in force writes nothing: there
      // is no change to date, and a row repeating it would announce one.
      if (next === chosen) {
        onClose()
        return
      }
      setSavingKey(next)
      setSaveError(null)
      try {
        await choose(next)
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setAcknowledged({ direction: next, effectiveFrom: startsOn })
        onChosen?.(next)
      } catch {
        setSaveError(SAVE_ERROR)
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      } finally {
        setSavingKey(null)
      }
    },
    [choose, chosen, onChosen, onClose, savingKey, startsOn],
  )

  const promise = pending
    ? `${formatLongTR(pending.effectiveFrom)}'den geçerli. O güne kadar şimdiki yönün sürüyor.`
    : isDefault
      ? `Seçtiğin yön ${formatLongTR(startsOn)}'den geçerli olur.`
      : `Bu yön şu an geçerli. Değiştirirsen ${formatLongTR(startsOn)}'den başlar.`

  const busy = loading || savingKey !== null
  const shownError = saveError ?? (error ? LOAD_ERROR : null)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <>
          <IconTarget size={22} color={violet} />
          <AppText weight="bold" className="text-lg text-ink">
            Yönüm
          </AppText>
        </>
      }
    >
      {acknowledged ? (
        <Acknowledged acknowledgement={acknowledged} accent={violet} />
      ) : (
        <>
          <View className="items-center">
            <Stage accent={violet}>
              <AfiPose pose="merak" motion="nefes" intro="giris" size={AFI_SIZE} />
            </Stage>
            <AppText weight="extrabold" className="text-center text-xl leading-7 text-ink">
              {QUESTION}
            </AppText>
            <AppText className="mt-1.5 text-center text-sm leading-5 text-soft">
              {INVITE}
            </AppText>
          </View>

          <View className="mt-4 rounded-xl bg-violet-50 px-3.5 py-2.5 dark:bg-violet-950/40">
            <AppText className="text-center text-xs leading-4 text-violet-700 dark:text-violet-300">
              {promise}
            </AppText>
          </View>

          <View className="mt-3 gap-2.5">
            {GOAL_DIRECTIONS.map((option) => {
              const isChosen = chosen === option.key
              const isSaving = savingKey === option.key
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isChosen, disabled: busy, busy: isSaving }}
                  accessibilityHint={`${formatLongTR(startsOn)}'den geçerli olur`}
                  disabled={busy}
                  onPress={() => {
                    void pick(option.key)
                  }}
                  className={`flex-row items-center gap-3 rounded-2xl border px-4 py-4 active:opacity-80 ${
                    isChosen
                      ? 'border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/50'
                      : 'border-line bg-surface'
                  } ${busy && !isSaving ? 'opacity-50' : ''}`}
                >
                  <View
                    className={`h-7 w-7 items-center justify-center rounded-full ${
                      isChosen
                        ? 'bg-violet-600 dark:bg-violet-500'
                        : 'border border-line bg-muted'
                    }`}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : isChosen ? (
                      <IconCheck size={16} color="#ffffff" strokeWidth={3} />
                    ) : null}
                  </View>
                  <AppText
                    weight={isChosen ? 'bold' : 'semibold'}
                    className="flex-1 text-base leading-6 text-ink"
                  >
                    {option.label}
                  </AppText>
                </Pressable>
              )
            })}
          </View>

          {isDefault && !pending ? (
            <AppText className="mt-3 text-center text-xs leading-4 text-faint">
              {DEFAULT_NOTE}
            </AppText>
          ) : null}

          {shownError ? (
            <AppText className="mt-3 text-center text-xs text-amber-600 dark:text-amber-400">
              {shownError}
            </AppText>
          ) : null}
        </>
      )}
    </Sheet>
  )
}

/** Afi's answer: what was heard, and the day it starts. Then it shows itself out. */
function Acknowledged({
  acknowledgement,
  accent,
}: {
  acknowledgement: Acknowledgement
  accent: string
}) {
  const label = goalDirectionMeta(acknowledgement.direction).label
  return (
    <View className="items-center pb-2">
      <Stage accent={accent}>
        <AfiPose pose="kutlama" size={AFI_SIZE} />
      </Stage>
      <AppText weight="extrabold" className="text-center text-xl text-ink">
        Anlaştık 🌿
      </AppText>
      <AppText className="mt-2 text-center text-base leading-6 text-soft">{label}</AppText>
      <AppText className="mt-2 text-center text-sm leading-5 text-faint">
        {`${formatLongTR(acknowledgement.effectiveFrom)} günü ölçülerini buna göre kurmaya başlıyorum. O güne kadar şimdiki düzenin sürüyor.`}
      </AppText>
    </View>
  )
}

/** The soft stage light Afi stands in, at sheet scale. */
function Stage({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <View style={{ width: STAGE, height: STAGE, alignItems: 'center', justifyContent: 'center' }}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="afi-direction-stage" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={accent} stopOpacity={0.26} />
              <Stop offset="0.55" stopColor={accent} stopOpacity={0.09} />
              <Stop offset="1" stopColor={accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#afi-direction-stage)" />
        </Svg>
      </View>
      {children}
    </View>
  )
}

/**
 * The doorway into the question, for a page that wants to offer it again later.
 *
 * The direction can be changed whenever someone wants (section 2), so it needs
 * a standing entry point now that its screen is gone. The row says what is in
 * force rather than only naming itself, and it never claims the silent default
 * as a choice.
 */
export function DirectionRow({ onPress }: { onPress: () => void }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const violet = isDark ? '#a78bfa' : '#7c3aed'
  const { direction, isDefault, pending } = useGoalDirection()

  const current = isDefault ? null : goalDirectionMeta(direction).label
  const subtitle = pending
    ? `${formatLongTR(pending.effectiveFrom)}: ${goalDirectionMeta(pending.direction).label}`
    : (current ?? 'Şu an dengede tutuyorum. İstersen bana bir yön söyle 🌿')

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={current ? `Yönüm: ${current}` : 'Yönünü seç'}
      accessibilityHint="Ölçülerinin neye göre kurulacağını seçersin"
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl bg-surface p-4 active:opacity-80"
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/50">
        <IconTarget size={22} color={violet} />
      </View>
      <View className="flex-1">
        <AppText weight="bold" className="text-ink">
          Yönüm
        </AppText>
        <AppText className="mt-0.5 text-xs leading-4 text-soft">{subtitle}</AppText>
      </View>
      <IconChevronRight size={18} color={t.faint} />
    </Pressable>
  )
}
