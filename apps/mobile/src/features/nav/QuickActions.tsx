import { router, type Href } from 'expo-router'
import { memo, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { AssistantMascot } from '@/features/chat/AssistantMascot'
import { ASSISTANTS } from '@/features/chat/assistants'
import type { AssistantId } from '@/features/chat/types'
import { trackTap } from '@/lib/track'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconBowl, IconScale } from '@/ui/icons'

/**
 * What the Afi button opens: the five things somebody reaches the app to do.
 *
 * Two of them are records and three of them are conversations, and the menu is
 * shaped like that split rather than like one list of five. The records are
 * rows, because each is an errand with a sentence attached; the sofra takımı is
 * a shelf of three faces, side by side, because choosing between them is
 * choosing who to talk to and a face answers that faster than a description.
 *
 * The records open where you already are: their sheets draw in the layer above
 * every screen (ui/overlayHost), and sending somebody to the right tab first
 * would move the ground under a person who only wanted to write down a meal.
 * They wear the colours their own sections wear everywhere else in the app.
 *
 * Sini and Demi ask for afiet+ from the third message on, which the gold pip
 * says quietly rather than putting a lock on the door: the first messages
 * really are free, and turning somebody away before they have met the
 * character is how an offer becomes a wall.
 */

export interface QuickActionsProps {
  /** Opens the add-food flow with no meal chosen yet. */
  onAddFood: () => void
  /** Opens today's measurement sheet. */
  onAddMeasurement: () => void
  /** Called after anything is taken, so the menu can shut itself. */
  onDone: () => void
}

/**
 * The two records wear the colour of the section they belong to, taken from the
 * Today screen's own table (`home/TodayBoard`) rather than picked again here:
 * food is emerald and the body is violet everywhere else in the app, and a menu
 * that renamed them would be teaching a second vocabulary for the same two
 * things.
 */
const TINTS = {
  emerald: { chip: 'bg-emerald-100 dark:bg-emerald-900/50', ink: ['#059669', '#34d399'] },
  violet: { chip: 'bg-violet-100 dark:bg-violet-900/50', ink: ['#7c3aed', '#a78bfa'] },
} as const

function RecordRow({
  tint,
  icon,
  title,
  hint,
  accessibilityLabel,
  onPress,
}: {
  tint: keyof typeof TINTS
  icon: (color: string) => ReactNode
  title: string
  hint: string
  accessibilityLabel: string
  onPress: () => void
}) {
  const { isDark } = useTheme()
  const { chip, ink } = TINTS[tint]

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className="min-h-14 flex-row items-center gap-3 rounded-2xl px-3 py-2.5 active:bg-muted"
    >
      <View className={`h-11 w-11 shrink-0 items-center justify-center rounded-xl ${chip}`}>
        {icon(ink[isDark ? 1 : 0])}
      </View>
      <View className="min-w-0 flex-1">
        <AppText weight="bold" numberOfLines={1} className="text-base text-ink">
          {title}
        </AppText>
        <AppText numberOfLines={1} className="text-xs text-soft">
          {hint}
        </AppText>
      </View>
    </Pressable>
  )
}

/** One of the three faces: mascot, name, nothing else. */
function AssistantColumn({
  assistant,
  premium,
  onDone,
}: {
  assistant: AssistantId
  premium?: boolean
  onDone: () => void
}) {
  const spec = ASSISTANTS[assistant]
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        premium ? `${spec.title} ile sohbeti aç, afiet+` : `${spec.title} ile sohbeti aç`
      }
      onPress={() => {
        trackTap('quick_action', { action: 'chat' })
        onDone()
        router.push(`/sohbet?asistan=${assistant}` as Href)
      }}
      className="flex-1 items-center gap-1 rounded-2xl px-1 py-2.5 active:bg-muted"
    >
      <View>
        <AssistantMascot assistant={assistant} size={76} />
        {/* Gold, the one colour afiet+ owns: it is neither the app's emerald
            nor a warning, and a grey pip read as "unavailable" rather than as
            "there is more of this". It rides the mascot instead of taking a
            line of its own, so all three columns stay the same height. */}
        {premium ? (
          <View className="absolute -right-1 top-0 rounded-full bg-amber-100 px-1.5 py-0.5 dark:bg-amber-900/60">
            <AppText weight="bold" className="text-[10px] text-amber-800 dark:text-amber-200">
              afiet+
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText weight="bold" numberOfLines={1} className="text-sm text-ink">
        {spec.title}
      </AppText>
    </Pressable>
  )
}

export const QuickActions = memo(function QuickActions({
  onAddFood,
  onAddMeasurement,
  onDone,
}: QuickActionsProps) {
  return (
    <View className="gap-0.5">
      <RecordRow
        tint="emerald"
        icon={(color) => <IconBowl size={22} color={color} />}
        title="Besin ekle"
        hint="Yediklerini sofrana ekle"
        accessibilityLabel="Besin ekle"
        onPress={() => {
          trackTap('quick_action', { action: 'add_food' })
          onDone()
          onAddFood()
        }}
      />
      <RecordRow
        tint="violet"
        icon={(color) => <IconScale size={22} color={color} />}
        title="Ölçüm ekle"
        hint="Bugünkü ölçünü kaydet"
        accessibilityLabel="Ölçüm ekle"
        onPress={() => {
          trackTap('quick_action', { action: 'add_measurement' })
          onDone()
          onAddMeasurement()
        }}
      />

      <View className="my-1 h-px bg-line/60" />

      <View className="flex-row">
        <AssistantColumn assistant="afi" onDone={onDone} />
        <AssistantColumn assistant="beslenme" premium onDone={onDone} />
        <AssistantColumn assistant="destek" premium onDone={onDone} />
      </View>
    </View>
  )
})
