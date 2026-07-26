import type { ReactNode } from 'react'
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
const SHELL =
  'flex-row items-center gap-2 overflow-hidden rounded-2xl bg-surface py-2.5 pl-2 pr-4'

/**
 * Afi's note on Today: one mascot, one line, at most one invitation.
 *
 * The note is remounted whenever the moment changes, so Afi visibly answers
 * what just happened instead of sitting there as a static banner. The entrance
 * defers to the system reduce-motion setting, and the mascot is decorative:
 * the line carries the meaning for a screen reader.
 */
export function AfiTodayNote({
  moment,
  onAddMeal,
}: {
  moment: AfiMoment
  onAddMeal: () => void
}) {
  const { isDark } = useTheme()
  const accent = ACCENTS[moment.accent][isDark ? 1 : 0]
  const invites = moment.action === 'meal'

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
        <AppText className="text-sm leading-5 text-ink">{moment.line}</AppText>
        {invites ? (
          <View className="mt-1 flex-row items-center gap-1">
            <AppText weight="bold" style={{ color: accent }} className="text-xs">
              Besin ekle
            </AppText>
            <IconChevronRight size={13} color={accent} />
          </View>
        ) : null}
      </View>
    </>
  )

  return (
    <Animated.View
      key={moment.key}
      entering={FadeInDown.duration(260).reduceMotion(ReduceMotion.System)}
      style={{ marginBottom: 16 }}
    >
      <NoteShell invites={invites} line={moment.line} onAddMeal={onAddMeal}>
        {body}
      </NoteShell>
    </Animated.View>
  )
}

/** The note is only a button when there is something to do; otherwise it reads. */
function NoteShell({
  invites,
  line,
  onAddMeal,
  children,
}: {
  invites: boolean
  line: string
  onAddMeal: () => void
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
      onPress={onAddMeal}
      className={`${SHELL} active:opacity-80`}
    >
      {children}
    </Pressable>
  )
}
