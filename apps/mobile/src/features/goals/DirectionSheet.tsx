import {
  GOAL_DIRECTIONS,
  formatLongTR,
  goalDirectionMeta,
  todayISO,
  type GoalDirection,
} from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconCheck, IconChevronRight, IconTarget } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { Sheet } from '@/ui/Sheet'
import { useGoalDirection } from './useGoalDirection'

/**
 * "Yönüm": Afi asks one question, and an answer is a tap.
 *
 * It is one question, so it is asked the way a question is asked: Afi is
 * present, the five answers are cards big enough to read in one glance, and
 * choosing one commits it. There is no confirm button, because there is nothing
 * to confirm.
 *
 * The sentences come from the engine's direction table verbatim. They describe
 * how someone wants to feel and never name weight, so this sheet quotes them
 * rather than rewording them (docs/hedeflerim.md, sections 3 and 12).
 *
 * The direction itself is now asked during body setup, so this sheet is the
 * later-change path: it is opened from the "Yönüm" row on Vücudum, and from
 * Afi's one-time catch-up offer on Today for accounts that finished setup
 * before the question existed.
 *
 * Someone who has never chosen runs on the silent `duzen` default. No card is
 * marked for them: the default is real, but it is ours, not theirs.
 */

const QUESTION = 'Ölçülerini neye göre kurayım?'
const INVITE = 'Sana en yakın gelene dokun, gerisini ben kurarım 🌿'
const SAVE_ERROR = 'Yönünü kaydedemedim. Bağlantını kontrol edip tekrar dener misin?'
const LOAD_ERROR = 'Yönünü şu an okuyamadım; şimdilik dengede tutuyorum.'

/** Long enough for the check to land on the card that was tapped, no longer. */
const CLOSE_AFTER_CHOICE_MS = 900
const AFI_SIZE = 72

/**
 * Fixed height, deliberately.
 *
 * With dynamic sizing the sheet asks for `content + handle` and is only capped
 * by `maxDynamicContentSize`, which `ui/Sheet` derives from the window. Inside a
 * tab the sheet's container is a tab bar shorter than that, so a tall sheet
 * resolves to a negative detent, overshoots the top of its container and gets
 * clipped by its `overflow: hidden`: the grab handle, the title row and the
 * Kapat button all disappear off the top edge. A ratio of the container can
 * never do that, and the content scrolls inside it. `BodySetupSheet` pins its
 * height for the same reason.
 */
const SHEET_HEIGHT_RATIO = 0.92

/**
 * The one quiet sentence about when the choice lands.
 *
 * A CHANGE waits for the coming Monday, because targets must not move mid week
 * under someone already eating to them (doc section 7). A FIRST choice has
 * nothing to protect and starts today, so promising a date would be both wrong
 * and discouraging. Either way it is said once, in the smallest voice on the
 * screen, never as a banner. Exported so the setup step uses the same words.
 */
export function directionStartsOnNote(startsOn: string, today: string): string | null {
  if (startsOn <= today) return 'Seçtiğin yön bugünden geçerli.'
  const day = formatLongTR(startsOn)
  return day ? `Seçtiğin yön ${day}'den geçerli olur.` : null
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
  const today = todayISO()
  const { direction, isDefault, pending, startsOn, choose, loading, error } = useGoalDirection(today)

  const [savingKey, setSavingKey] = useState<GoalDirection | null>(null)
  const [committed, setCommitted] = useState<GoalDirection | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Every opening is a fresh question; the last answer must not greet the next.
  useEffect(() => {
    if (open) {
      setCommitted(null)
      setSaveError(null)
    }
  }, [open])

  /* The tap is the whole answer: the card takes the check, the haptic lands and
     the sheet shows itself out. There is no confirmation beat to sit through,
     and the row this sheet was opened from carries the date afterwards. */
  useEffect(() => {
    if (!committed) return
    const timer = setTimeout(onClose, CLOSE_AFTER_CHOICE_MS)
    return () => clearTimeout(timer)
  }, [committed, onClose])

  /* The latest choice is what the cards show as chosen, even before it starts.
     While one is being stored, and for the beat after it lands, it is shown as
     chosen too, so the tap answers immediately instead of waiting for the
     stored log to be read back. */
  const chosen: GoalDirection | null =
    savingKey ?? committed ?? pending?.direction ?? (isDefault ? null : direction)

  const pick = useCallback(
    async (next: GoalDirection) => {
      if (savingKey || committed) return
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
        setCommitted(next)
        onChosen?.(next)
      } catch {
        setSaveError(SAVE_ERROR)
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      } finally {
        setSavingKey(null)
      }
    },
    [choose, chosen, committed, onChosen, onClose, savingKey],
  )

  const startsOnNote = directionStartsOnNote(startsOn, today)
  const busy = loading || savingKey !== null
  const shownError = saveError ?? (error ? LOAD_ERROR : null)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      heightRatio={SHEET_HEIGHT_RATIO}
      title={
        <>
          <IconTarget size={22} color={violet} />
          <AppText weight="bold" className="text-lg text-ink">
            Yönüm
          </AppText>
        </>
      }
    >
      {/* Afi stands beside the question rather than above it: a centred mascot
          under the sheet's own title read as a second header and pushed the
          five answers off the first screenful. */}
      <View className="flex-row items-center gap-3">
        <AfiPose pose="merak" motion="nefes" intro="giris" size={AFI_SIZE} />
        <View className="min-w-0 flex-1">
          <AppText weight="extrabold" className="text-xl leading-7 text-ink">
            {QUESTION}
          </AppText>
          <AppText className="mt-1 text-sm leading-5 text-soft">{INVITE}</AppText>
        </View>
      </View>

      <View className="mt-4 gap-2.5">
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
              className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-80 ${
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

      {startsOnNote ? (
        <AppText className="mt-3 text-center text-xs leading-4 text-faint">
          {startsOnNote}
        </AppText>
      ) : null}

      {shownError ? (
        <AppText className="mt-3 text-center text-xs text-amber-600 dark:text-amber-400">
          {shownError}
        </AppText>
      ) : null}
    </Sheet>
  )
}

/**
 * The doorway into the question, for a page that wants to offer it again later.
 *
 * The direction can be changed whenever someone wants (section 2), so it needs
 * a standing entry point outside setup. It says what is in force rather than
 * only naming itself, it names the day a queued choice starts on, and it never
 * claims the silent default as a choice.
 *
 * Two shapes, same content. `row` is the full width list row. `card` stacks the
 * same parts the way `NumbersCard` does, because half a screen leaves a row's
 * text about forty points of width and the subtitle turns into a tower that
 * makes the card twice as tall as the one beside it.
 */
export function DirectionRow({
  onPress,
  variant = 'row',
  className,
}: {
  onPress: () => void
  variant?: 'row' | 'card'
  /** Merged into the root, so a caller can make the card share a row. */
  className?: string
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const violet = isDark ? '#a78bfa' : '#7c3aed'
  const { direction, isDefault, pending } = useGoalDirection()

  const current = isDefault ? null : goalDirectionMeta(direction).label
  const subtitle = pending
    ? `${formatLongTR(pending.effectiveFrom)}: ${goalDirectionMeta(pending.direction).label}`
    : (current ?? 'Şu an dengede tutuyorum. İstersen bana bir yön söyle 🌿')

  const tile = (
    <View className="h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/50">
      <IconTarget size={22} color={violet} />
    </View>
  )
  const chevron = <IconChevronRight size={18} color={t.faint} />
  const accessibility = {
    accessibilityRole: 'button' as const,
    accessibilityLabel: current ? `Yönüm: ${current}` : 'Yönünü seç',
    accessibilityHint: 'Ölçülerinin neye göre kurulacağını seçersin',
  }

  if (variant === 'card') {
    return (
      <Pressable
        {...accessibility}
        onPress={onPress}
        className={`rounded-2xl bg-surface p-4 active:opacity-80 ${className ?? ''}`}
      >
        <View className="flex-row items-start justify-between">
          {tile}
          {chevron}
        </View>
        <AppText weight="bold" className="mt-2.5 text-ink">
          Yönüm
        </AppText>
        <AppText numberOfLines={3} className="mt-0.5 text-xs leading-4 text-soft">
          {subtitle}
        </AppText>
      </Pressable>
    )
  }

  return (
    <Pressable
      {...accessibility}
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl bg-surface p-4 active:opacity-80 ${
        className ?? ''
      }`}
    >
      {tile}
      <View className="flex-1">
        <AppText weight="bold" className="text-ink">
          Yönüm
        </AppText>
        <AppText className="mt-0.5 text-xs leading-4 text-soft">{subtitle}</AppText>
      </View>
      {chevron}
    </Pressable>
  )
}
