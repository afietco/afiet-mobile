import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import type { AfiNutritionAccent, AfiNutritionMoment } from './afiNutritionMoment'

/** Section accents used on Beslenme, as [light, dark]. */
const ACCENTS: Record<AfiNutritionAccent, [string, string]> = {
  emerald: ['#059669', '#34d399'],
  amber: ['#d97706', '#fbbf24'],
}

const AFI_SIZE = 56
/** The stage box around Afi; the glow needs room to fall off to nothing. */
const STAGE = 74
/** Long enough to read a two line sentence without hurrying. */
const ROTATE_MS = 5000
const SHELL =
  'flex-row items-center gap-2 overflow-hidden rounded-2xl bg-surface py-2.5 pl-2 pr-4'

/**
 * Afi's note on Beslenme: one mascot, and everything Afi can truthfully say
 * about today's plate, one line at a time.
 *
 * Each moment brings its own pose, motion and accent, and the card is remounted
 * as it changes so Afi visibly answers instead of sitting there as a static
 * banner. The entrance defers to the system reduce-motion setting; the rotation
 * itself is a content change rather than motion, so it keeps running either way.
 *
 * The mascot is decorative: the line carries the meaning for a screen reader.
 *
 * The rotation state lives out here and the drawn card is memoised underneath,
 * so the screen re-rendering (it does, on every live query tick) never repaints
 * the mascot and its glow unless the moment itself actually changed.
 */
export function AfiNutritionNote({
  moments,
  onAddFood,
}: {
  moments: AfiNutritionMoment[]
  onAddFood: () => void
}) {
  const [index, setIndex] = useState(0)
  /* Identity of the set, not of the array: the screen rebuilds the list on
     every render, but it only *changed* when the states themselves changed. */
  const signature = moments.map((moment) => moment.key).join('|')
  const total = moments.length

  /* When the plate changes what Afi has to say, the rotation starts again from
     the most important note. Adjusted during render rather than in an effect,
     so no frame is ever painted with the stale index. */
  const [rotatingFor, setRotatingFor] = useState(signature)
  if (signature !== rotatingFor) {
    setRotatingFor(signature)
    setIndex(0)
  }

  useEffect(() => {
    if (total < 2) return
    const timer = setInterval(() => setIndex((current) => (current + 1) % total), ROTATE_MS)
    return () => clearInterval(timer)
  }, [signature, total])

  /* The screen hands in a fresh closure on every render. Reading it through a
     ref keeps the drawn card's handler stable, which is what lets the memo
     below hold; the ref is refreshed after every render of this component, and
     this component is never itself memoised. */
  const addFoodRef = useRef(onAddFood)
  useEffect(() => {
    addFoodRef.current = onAddFood
  })
  const handleAddFood = useCallback(() => addFoodRef.current(), [])

  // Index and list can disagree for one render right after the set shrinks.
  const shown = index < total ? index : 0
  const moment = moments[shown]
  if (!moment) return null

  return <NoteCard moment={moment} index={shown} total={total} onAddFood={handleAddFood} />

}

interface NoteCardProps {
  moment: AfiNutritionMoment
  index: number
  total: number
  onAddFood: () => void
}

/** Nothing here changes unless the shown moment does, so it is worth guarding. */
function sameCard(prev: NoteCardProps, next: NoteCardProps) {
  return (
    prev.index === next.index &&
    prev.total === next.total &&
    prev.onAddFood === next.onAddFood &&
    prev.moment.key === next.moment.key &&
    prev.moment.line === next.moment.line &&
    prev.moment.pose === next.moment.pose &&
    prev.moment.motion === next.moment.motion &&
    prev.moment.accent === next.moment.accent &&
    prev.moment.action === next.moment.action
  )
}

const NoteCard = memo(function NoteCard({ moment, index, total, onAddFood }: NoteCardProps) {
  const { isDark } = useTheme()
  const accent = ACCENTS[moment.accent][isDark ? 1 : 0]
  const invites = moment.action === 'food'
  const showsRail = total > 1

  return (
    <Animated.View
      key={moment.key}
      entering={FadeInDown.duration(260).reduceMotion(ReduceMotion.System)}
    >
      <NoteShell invites={invites} line={moment.line} onAddFood={onAddFood}>
        <View
          style={{ width: STAGE, height: STAGE, alignItems: 'center', justifyContent: 'center' }}
        >
          <Glow accent={moment.accent} color={accent} />
          <AfiPose pose={moment.pose} motion={moment.motion} size={AFI_SIZE} />
        </View>

        <View className="min-w-0 flex-1">
          <AppText className="text-sm leading-5 text-ink">{moment.line}</AppText>
          {invites || showsRail ? (
            <View className="mt-1.5 flex-row items-center justify-between gap-3">
              {invites ? (
                <View className="flex-row items-center gap-1">
                  <AppText weight="bold" style={{ color: accent }} className="text-xs">
                    Besin ekle
                  </AppText>
                  <IconChevronRight size={13} color={accent} />
                </View>
              ) : (
                <View />
              )}
              {showsRail ? <Rail count={total} active={index} accent={accent} /> : null}
            </View>
          ) : null}
        </View>
      </NoteShell>
    </Animated.View>
  )
}, sameCard)

/** The same soft stage light the introduction uses, at note scale. */
const Glow = memo(function Glow({
  accent,
  color,
}: {
  accent: AfiNutritionAccent
  color: string
}) {
  const id = `afi-nutrition-note-${accent}`
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.24} />
            <Stop offset="0.55" stopColor={color} stopOpacity={0.08} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  )
})

/** How many things Afi has to say, and which one is showing. */
function Rail({ count, active, accent }: { count: number; active: number; accent: string }) {
  return (
    <View className="flex-row items-center gap-1">
      {Array.from({ length: count }, (_, i) => (
        <View
          key={String(i)}
          style={{
            width: i === active ? 10 : 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: accent,
            opacity: i === active ? 1 : 0.28,
          }}
        />
      ))}
    </View>
  )
}

/** The note is only a button when there is something to do; otherwise it reads. */
function NoteShell({
  invites,
  line,
  onAddFood,
  children,
}: {
  invites: boolean
  line: string
  onAddFood: () => void
  children: ReactNode
}) {
  if (!invites) {
    return (
      <View accessible accessibilityLabel={line} className={SHELL}>
        {children}
      </View>
    )
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${line} Besin ekle.`}
      onPress={onAddFood}
      className={`${SHELL} active:opacity-80`}
    >
      {children}
    </Pressable>
  )
}
