import { useEffect, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import type { AfiAccent, AfiMoment } from './afiMoment'

/** Section accents already used on Today, as [light, dark]. */
const ACCENTS: Record<AfiAccent, [string, string]> = {
  emerald: ['#059669', '#34d399'],
  sky: ['#0284c7', '#38bdf8'],
  amber: ['#d97706', '#fbbf24'],
  violet: ['#7c3aed', '#a78bfa'],
}

const AFI_SIZE = 56
/** The stage box around Afi; the glow needs room to fall off to nothing. */
const STAGE = 74
/** Long enough to read a two line sentence without hurrying. */
const ROTATE_MS = 5000
const SHELL =
  'flex-row items-center gap-2 overflow-hidden rounded-2xl bg-surface py-2.5 pl-2 pr-4'

/**
 * Afi's note on Today: one mascot, and everything Afi can truthfully say about
 * the day, one line at a time.
 *
 * Each moment brings its own pose, motion and accent, and the card is remounted
 * as it changes so Afi visibly answers instead of sitting there as a static
 * banner. The entrance defers to the system reduce-motion setting; the rotation
 * itself is a content change rather than motion, so it keeps running either way.
 *
 * The mascot is decorative: the line carries the meaning for a screen reader.
 */
export function AfiTodayNote({
  moments,
  onAddMeal,
  onOpenBody,
  onOpenGoals,
}: {
  moments: AfiMoment[]
  onAddMeal: () => void
  onOpenBody: () => void
  /** Afi's one-time offer to set a goal direction leads here. */
  onOpenGoals: () => void
}) {
  const { isDark } = useTheme()
  const [index, setIndex] = useState(0)
  /* Identity of the set, not of the array: the screen rebuilds the list on
     every render, but it only *changed* when the states themselves changed. */
  const signature = moments.map((moment) => moment.key).join('|')
  const total = moments.length

  /* When the day changes what Afi has to say, the rotation starts again from
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

  // Index and list can disagree for one render right after the set shrinks.
  const moment = moments[index] ?? moments[0]
  if (!moment) return null

  const accent = ACCENTS[moment.accent][isDark ? 1 : 0]
  const invites = moment.action !== null
  const inviteLabel =
    moment.action === 'body'
      ? 'Ölçüm ekle'
      : moment.action === 'goal'
        ? 'Yönümü seç'
        : 'Besin ekle'
  const invite =
    moment.action === 'body' ? onOpenBody : moment.action === 'goal' ? onOpenGoals : onAddMeal
  const showsRail = total > 1

  const body = (
    <>
      <View
        style={{ width: STAGE, height: STAGE, alignItems: 'center', justifyContent: 'center' }}
      >
        {/* The same soft stage light the introduction uses, at note scale. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id={`afi-note-${moment.accent}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={accent} stopOpacity={0.24} />
                <Stop offset="0.55" stopColor={accent} stopOpacity={0.08} />
                <Stop offset="1" stopColor={accent} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#afi-note-${moment.accent})`} />
          </Svg>
        </View>
        <AfiPose pose={moment.pose} motion={moment.motion} size={AFI_SIZE} />
      </View>

      <View className="min-w-0 flex-1">
        <AppText className="text-sm text-ink">{moment.line}</AppText>
        {invites || showsRail ? (
          <View className="mt-1.5 flex-row items-center justify-between gap-3">
            {invites ? (
              <View className="flex-row items-center gap-1">
                <AppText weight="bold" style={{ color: accent }} className="text-xs">
                  {inviteLabel}
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
    </>
  )

  return (
    <Animated.View
      key={moment.key}
      entering={FadeInDown.duration(260).reduceMotion(ReduceMotion.System)}
    >
      <NoteShell invites={invites} label={inviteLabel} line={moment.line} onPress={invite}>
        {body}
      </NoteShell>
    </Animated.View>
  )
}

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
  label,
  line,
  onPress,
  children,
}: {
  invites: boolean
  label: string
  line: string
  onPress: () => void
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
      accessibilityLabel={`${line} ${label}.`}
      onPress={onPress}
      className={`${SHELL} active:opacity-80`}
    >
      {children}
    </Pressable>
  )
}
