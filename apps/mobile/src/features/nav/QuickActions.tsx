import { router, type Href } from 'expo-router'
import { memo, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { AssistantMascot } from '@/features/chat/AssistantMascot'
import { ASSISTANTS } from '@/features/chat/assistants'
import type { AssistantId } from '@/features/chat/types'
import { trackTap } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconBowl, IconScale } from '@/ui/icons'

/**
 * What the Afi button opens: the five things somebody reaches the app to do.
 *
 * Two of them are records and three of them are conversations, and the split is
 * deliberate rather than decorative. Adding a food and adding a measurement are
 * the app's own flows and open where you already are, because their sheets draw
 * in a layer above every screen (ui/overlayHost) and jumping tabs first would
 * move the ground under somebody who only wanted to write down a meal.
 *
 * The three conversations are the sofra takımı, each with its own face: Afi the
 * bowl who is here all day and free, Sini the tray who talks about the week's
 * proportions, Demi the teapot who is for after the meal. Sini and Demi ask for
 * afiet+ from the third message on, which the badge says quietly rather than
 * putting a lock on the door: the first messages really are free, and turning
 * somebody away before they have met the character is how an offer becomes a
 * wall.
 */

export interface QuickActionsProps {
  /** Opens the add-food flow with no meal chosen yet. */
  onAddFood: () => void
  /** Opens today's measurement sheet. */
  onAddMeasurement: () => void
  /** Called after any row is taken, so the menu can shut itself. */
  onDone: () => void
}

function Row({
  icon,
  title,
  hint,
  badge,
  accessibilityLabel,
  onPress,
}: {
  icon: ReactNode
  title: string
  hint: string
  badge?: string
  accessibilityLabel: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className="min-h-14 flex-row items-center gap-3 rounded-2xl px-3 py-2.5 active:bg-muted"
    >
      <View className="h-11 w-11 shrink-0 items-center justify-center">{icon}</View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-1.5">
          <AppText weight="bold" numberOfLines={1} className="min-w-0 shrink text-base text-ink">
            {title}
          </AppText>
          {badge ? (
            <View className="shrink-0 rounded-full bg-muted px-1.5 py-0.5">
              <AppText weight="bold" className="text-[10px] text-soft">
                {badge}
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText numberOfLines={1} className="text-xs text-soft">
          {hint}
        </AppText>
      </View>
    </Pressable>
  )
}

function ChatRow({
  assistant,
  badge,
  onDone,
}: {
  assistant: AssistantId
  badge?: string
  onDone: () => void
}) {
  const spec = ASSISTANTS[assistant]
  return (
    <Row
      icon={<AssistantMascot assistant={assistant} size={40} />}
      title={spec.title}
      hint={spec.subtitle}
      badge={badge}
      accessibilityLabel={`${spec.title} ile sohbeti aç`}
      onPress={() => {
        trackTap('quick_action', { action: 'chat' })
        onDone()
        router.push(`/sohbet?asistan=${assistant}` as Href)
      }}
    />
  )
}

export const QuickActions = memo(function QuickActions({
  onAddFood,
  onAddMeasurement,
  onDone,
}: QuickActionsProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']

  return (
    <View className="gap-0.5">
      <Row
        icon={<IconBowl size={24} color={t.ink} />}
        title="Besin ekle"
        hint="Sofrana bir şey yaz"
        accessibilityLabel="Besin ekle"
        onPress={() => {
          trackTap('quick_action', { action: 'add_food' })
          onDone()
          onAddFood()
        }}
      />
      <Row
        icon={<IconScale size={24} color={t.ink} />}
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

      <ChatRow assistant="afi" onDone={onDone} />
      <ChatRow assistant="beslenme" badge="afiet+" onDone={onDone} />
      <ChatRow assistant="destek" badge="afiet+" onDone={onDone} />
    </View>
  )
})
