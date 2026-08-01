import { router, type Href } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import type { AcquaintanceFacts } from './useGoals'
import { IconCheck, IconChevronRight, IconPlus } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { useMotionActive } from '@/ui/motionGate'

/**
 * "Afi seni %60 tanıyor": how personal the measures already are.
 *
 * This is an invitation, never a score. It says what Afi already knows before
 * it says what is still missing, every missing line is a door that opens
 * somewhere, and no line ever implies the person fell short.
 *
 * Afi says the sentence that carries his name, so he stands next to it. The
 * pose is `merak`, curiosity: someone leaning in to get to know you. The
 * inspecting poses (`arama` and its magnifier) were deliberately not used,
 * because a mascot examining the person is exactly the judging read this meter
 * must never have. Once there is nothing left to learn curiosity would be a
 * lie, so the figure settles into `sicaklik`, which is the warmth the closing
 * line already speaks in.
 *
 * Movement-data permission is deliberately absent. It does not exist in the
 * beta, so listing it would leave everyone short of 100 with an invitation
 * nobody can accept. When it arrives it belongs in a separate "even better"
 * card rather than in these weights, otherwise people who reached 100 would
 * wake up at 80.
 */

export type AcquaintanceKey = 'temel' | 'kilo' | 'mezura' | 'kayit'

/** Long enough to read a line without hurrying; the Afi notes use the same. */
const ROTATE_MS = 5000

interface AcquaintanceStep {
  key: AcquaintanceKey
  /** Share of the meter. The four shares total 100. */
  weight: number
  /** Read when Afi already has it. */
  done: string
  /** Read when it is still an open door. */
  invite: string
  /** Where the invitation leads when the host does not handle it itself. */
  href: Href
}

const STEPS: readonly AcquaintanceStep[] = [
  {
    key: 'temel',
    weight: 40,
    done: 'Boy, yaş ve hareket düzeyin',
    invite: 'Boy, yaş ve hareket düzeyini ekle',
    href: '/vucudum',
  },
  {
    key: 'kilo',
    weight: 20,
    done: 'İlk kilo ölçümün',
    invite: 'İlk kilo ölçünü ekle',
    href: '/vucudum',
  },
  {
    key: 'mezura',
    weight: 25,
    done: 'Mezura ölçün',
    invite: 'Mezura ölçünü ekle',
    href: '/vucudum',
  },
  {
    key: 'kayit',
    weight: 15,
    done: '2 haftalık kayıt',
    invite: 'Sofranı kaydetmeye devam et',
    href: '/(tabs)',
  },
]

export type { AcquaintanceFacts }

export interface AcquaintanceMeterProps {
  facts: AcquaintanceFacts
  /**
   * Lets the host accept an invitation in place, which is what Vücudum does:
   * three of the four doors are sheets that screen already owns, and pushing a
   * route to the screen you are standing on would do nothing. Without it every
   * invitation falls back to navigation.
   */
  onInvite?: (key: AcquaintanceKey) => void
}

/** Which facts Afi already holds, in the listed order. */
function has(facts: AcquaintanceFacts, key: AcquaintanceKey): boolean {
  if (key === 'temel') return facts.basics
  if (key === 'kilo') return facts.firstWeight
  if (key === 'mezura') return facts.tapeMeasure
  return facts.twoWeeksLogged
}

/** How well Afi knows this person, 0 to 100. */
function acquaintancePercent(facts: AcquaintanceFacts): number {
  return STEPS.reduce((total, step) => (has(facts, step.key) ? total + step.weight : total), 0)
}

export function AcquaintanceMeter({ facts, onInvite }: AcquaintanceMeterProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const violet = isDark ? '#a78bfa' : '#7c3aed'
  const emerald = isDark ? '#34d399' : '#059669'

  const percent = acquaintancePercent(facts)
  const complete = percent === 100

  /**
   * One line at a time, the way Afi speaks everywhere else on Today and
   * Beslenme (see home/AfiTodayNote).
   *
   * Four rows at once made the tallest card on the screen out of a sentence
   * and a bar, and three of those rows were things already done, sitting in
   * the way of the one thing left to do. What is open comes first, so the card
   * opens on something actionable and the rest cycles past behind it.
   *
   * The rotation is gated on `useMotionActive`: a tab keeps its screen mounted
   * after you leave it, and an ungated interval would go on waking this tree
   * from behind whichever tab you are actually on.
   */
  const pages = [
    ...STEPS.filter((step) => !has(facts, step.key)),
    ...STEPS.filter((step) => has(facts, step.key)),
  ]
  const [index, setIndex] = useState(0)
  const signature = pages.map((page) => page.key).join('|')
  const [rotatingFor, setRotatingFor] = useState(signature)
  if (signature !== rotatingFor) {
    setRotatingFor(signature)
    setIndex(0)
  }

  const rotating = useMotionActive()
  useEffect(() => {
    if (pages.length < 2 || !rotating) return
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % pages.length),
      ROTATE_MS,
    )
    return () => clearInterval(timer)
  }, [signature, pages.length, rotating])

  const step = pages[index] ?? pages[0]
  const done = has(facts, step.key)

  return (
    <View className="rounded-2xl bg-surface p-4">
      <View className="flex-row items-center gap-2">
        {/* Decorative on purpose: the sentence beside Afi already says it all,
            and a screen reader repeating the mascot would only slow it down. */}
        <AfiPose pose={complete ? 'sicaklik' : 'merak'} size={64} />
        <View className="flex-1">
          <AppText weight="bold" className="text-ink">
            Afi seni %{percent} tanıyor
          </AppText>
          <AppText className="mt-1 text-xs leading-5 text-soft">
            {complete
              ? 'Şimdilik bilmem gereken her şey elimde 💛'
              : 'Ne kadar tanışırsak ölçüler o kadar sana benziyor.'}
          </AppText>
        </View>
      </View>

      {/* The track carries the accessibility node, not the fill: at 0% the fill
          has no width and a screen reader would skip straight past it. */}
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Tanışma göstergesi yüzde ${percent}`}
        accessibilityValue={{ min: 0, max: 100, now: percent }}
        className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950"
      >
        <View className="h-full rounded-full bg-violet-500" style={{ width: `${percent}%` }} />
      </View>

      <View className="mt-3">
        <Animated.View
          key={step.key}
          entering={FadeInDown.duration(260).reduceMotion(ReduceMotion.System)}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          {done ? (
            <View className="flex-row items-center gap-2.5 px-1">
              <IconCheck size={16} color={emerald} strokeWidth={2.6} />
              <AppText className="flex-1 text-sm text-soft">{step.done}</AppText>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={step.invite}
              onPress={() => (onInvite ? onInvite(step.key) : router.push(step.href))}
              className="flex-row items-center gap-2.5 rounded-xl bg-violet-50 px-3 py-2.5 active:opacity-80 dark:bg-violet-950/50"
            >
              <IconPlus size={16} color={violet} strokeWidth={2.6} />
              <AppText
                weight="semibold"
                className="flex-1 text-sm text-violet-800 dark:text-violet-200"
              >
                {step.invite}
              </AppText>
              <IconChevronRight size={16} color={t.faint} />
            </Pressable>
          )}
        </Animated.View>

        {STEPS.length > 1 ? (
          <View className="mt-2.5 flex-row items-center justify-center gap-1">
            {pages.map((page, i) => (
              <View
                key={page.key}
                style={{
                  width: i === index ? 10 : 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: violet,
                  opacity: i === index ? 1 : 0.28,
                }}
              />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  )
}
