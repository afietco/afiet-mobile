import type { ApiSummary } from '@/data/api/client'
import { Link } from 'expo-router'
import { useMemo, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated'
import { HandMeasures } from '@/features/goals/HandMeasures'
import { useGoals } from '@/features/goals/useGoals'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'
import { MacroProgressCard } from './MacroProgressCard'
import { useMeasureView } from './measureViewPreference'
import { MeasureViewToggle } from './MeasureViewToggle'
import { measureTargetsState, type MeasureTargetsState } from './measureViewTargets'

/**
 * "Günün ölçüsü" on Beslenme: one card, two languages, one engine.
 *
 * The hand measures are the card's default and its primary language; the grams
 * and calories are one tap away and are remembered once someone prefers them
 * (docs/hedeflerim.md section 12). Both bodies read `useGoals`, so the two can
 * never disagree about the same day, and the toggle swaps the body while the
 * header stays mounted: switching costs a fade, not a rebuild.
 *
 * The engine runs inside `useGoals`, which memoizes it. This screen re-renders
 * on every meal notification, so nothing here may recompute a target.
 */

const MISSING_INPUTS =
  "Günün ölçüsünü kurabilmem için seni biraz daha tanımam gerek. Vücudum'a birkaç bilgi eklersen burası dolacak 🌱"

/** Under 18 the engine gives no target at all, only balance language (doc 9). */
const MINOR_BALANCE =
  'Şimdilik sana sayısal bir ölçü kurmuyorum. Sofrandaki denge yeter: her öğünde bir sebze, bir protein, bir tahıl 🌱'

/** A direction was never chosen, so the engine keeps the numbers muted. The
 *  hand measures are unaffected and stay in full. */
const UNCHOSEN_DIRECTION = "Vücudum'da yönünü seçersen ölçünü sayıyla da kurarım."

const MEASURE_LOADING = 'Günün ölçüsü hazırlanıyor.'
const MEASURE_ERROR = 'Ölçünü şu an getiremedim.'

function VucudumLink() {
  return (
    <Link href="/vucudum">
      <AppText weight="semibold" className="text-xs text-violet-700 underline dark:text-violet-300">
        Vücudum
      </AppText>
    </Link>
  )
}

function RetryLine({ onRetry }: { onRetry: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8}>
      <AppText weight="semibold" className="text-xs text-violet-700 underline dark:text-violet-300">
        Tekrar dene
      </AppText>
    </Pressable>
  )
}

/** The sentence under the numbers when there is no target to measure against. */
function NumbersNote({
  state,
  failed,
  onRetry,
}: {
  state: MeasureTargetsState
  failed: boolean
  onRetry: () => void
}) {
  if (failed) {
    return (
      <View className="mt-3 flex-row items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 dark:bg-violet-950/50">
        <AppText className="flex-1 text-xs text-violet-700 dark:text-violet-300">
          {MEASURE_ERROR}
        </AppText>
        <RetryLine onRetry={onRetry} />
      </View>
    )
  }

  // Loading needs no sentence here: the bars already say the reference is on
  // its way, and a second line would only repeat it.
  if (state.kind === 'ready' || state.kind === 'loading') return null

  return (
    <View className="mt-3 rounded-xl bg-violet-50 px-3 py-2 dark:bg-violet-950/50">
      <AppText className="text-xs leading-5 text-violet-700 dark:text-violet-300">
        {state.kind === 'minor' ? MINOR_BALANCE : null}
        {state.kind === 'incomplete' ? (
          <>
            {MISSING_INPUTS} <VucudumLink />
          </>
        ) : null}
        {state.kind === 'unchosen' ? (
          <>
            {UNCHOSEN_DIRECTION} <VucudumLink />
          </>
        ) : null}
      </AppText>
    </View>
  )
}

/** The hand view when the engine has no measures to hand over yet. */
function PendingMeasures({
  state,
  failed,
  onRetry,
}: {
  state: MeasureTargetsState
  failed: boolean
  onRetry: () => void
}) {
  if (failed) {
    return (
      <View className="flex-row items-center gap-3">
        <AppText className="flex-1 text-sm text-soft">{MEASURE_ERROR}</AppText>
        <RetryLine onRetry={onRetry} />
      </View>
    )
  }

  // No mascot for a state that lasts a moment; Afi appearing and leaving again
  // would be the loudest thing on the page.
  if (state.kind === 'loading') {
    return <AppText className="text-sm text-soft">{MEASURE_LOADING}</AppText>
  }

  return (
    <View className="flex-row items-center gap-2">
      <AfiPose pose="merak" size={64} />
      <AppText className="flex-1 text-sm leading-5 text-soft">
        {state.kind === 'minor' ? (
          MINOR_BALANCE
        ) : (
          <>
            {MISSING_INPUTS} <VucudumLink />
          </>
        )}
      </AppText>
    </View>
  )
}

export function DailyMeasureCard({ summary }: { summary: ApiSummary }) {
  const { view, setView } = useMeasureView()
  const { goals, loading, error, retry } = useGoals({ today: summary.date })

  /* A half loaded engine is treated as no engine: the direction arrives from
     storage a beat after the profile does, and rendering measures that shift
     under the reader once it lands would cost more than the extra moment. */
  const settled = loading ? null : goals
  const state = useMemo(() => measureTargetsState(settled), [settled])
  const failed = settled == null && error != null
  const hand = settled?.hand ?? null

  let body: ReactNode
  if (view === 'hand') {
    body =
      hand && settled ? (
        <HandMeasures measures={hand} note={settled.confidenceNote} />
      ) : (
        <PendingMeasures state={state} failed={failed} onRetry={retry} />
      )
  } else {
    body = (
      <MacroProgressCard
        summary={summary}
        targets={state.kind === 'ready' ? state.targets : null}
        note={<NumbersNote state={state} failed={failed} onRetry={retry} />}
      />
    )
  }

  return (
    <View className="rounded-2xl bg-surface p-4">
      <View className="flex-row items-center justify-between gap-3">
        <AppText weight="bold" className="shrink text-xs tracking-wide text-faint">
          GÜNÜN ÖLÇÜSÜ
        </AppText>
        <MeasureViewToggle value={view} onChange={setView} />
      </View>

      {/* Only the body swaps; the header and the toggle stay mounted. The fade
          is short on purpose and yields to reduce motion. */}
      <Animated.View
        key={view}
        entering={FadeIn.duration(140).reduceMotion(ReduceMotion.System)}
        className="mt-3"
      >
        {body}
      </Animated.View>
    </View>
  )
}
