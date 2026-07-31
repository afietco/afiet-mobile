import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import type { ApiQuest } from '@/data/api/client'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconCheck, IconChevronRight, IconSparkles } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { Sheet } from '@/ui/Sheet'
import {
  questAction,
  questCounter,
  questNarration,
  questRemaining,
  type QuestAction,
} from './questGuide'

/**
 * A quest, explained by Afi, with the one tap that moves it.
 *
 * The list is deliberately terse: a title, a one-line label and a bar. That is
 * the right amount to glance at and the wrong amount to understand, and a row
 * nobody could tap was a row nobody could ask about. Three of the fourteen
 * quests count something no title can carry on its own (distinct foods, not
 * logs; whole weeks, not days; one greeting per person per day), and people
 * were left to infer the rule from a bar that moved at unexpected times.
 *
 * So the row opens, and what opens says three things in order: what the quest
 * counts, how far along it is, and where to go and do it. A finished quest
 * opens too. It has nothing left to start, but it is the only place its story
 * is written down, and reading back why something was earned is most of what
 * makes it worth having earned.
 */

/**
 * Leaves Görevlerim behind on the way to the action.
 *
 * `navigate` rather than `push`, because every target is either the tabs
 * themselves or a screen reachable from them: pushing would stack a second
 * copy of a screen already in the history. Dismissing first is what stops the
 * list waiting underneath, since someone who taps "Öğün ekle" is going to add
 * a meal rather than come back and read the same quest again.
 */
function startQuestAction(action: QuestAction): void {
  if (router.canDismiss()) router.dismissAll()
  router.navigate(action.href)
}

interface QuestDetailSheetProps {
  quest: ApiQuest | null
  onClose: () => void
  /** Shown for a finished but unclaimed quest; absent everywhere else. */
  onClaim?: (quest: ApiQuest) => void
  claiming?: boolean
}

function DetailProgress({ quest }: { quest: ApiQuest }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const percent =
    quest.target > 0 ? Math.min(100, Math.round((quest.progress / quest.target) * 100)) : 0
  const remaining = questRemaining(quest)

  return (
    <View className="mt-5">
      <View className="flex-row items-end justify-between">
        <AppText weight="bold" className="text-ink">
          {questCounter(quest)}
        </AppText>
        {remaining ? <AppText className="text-sm text-soft">{remaining}</AppText> : null}
      </View>
      <View
        className="mt-2 h-2 overflow-hidden rounded-full"
        style={{ backgroundColor: t.muted }}
      >
        <View
          className="h-2 rounded-full bg-emerald-500"
          style={{ width: `${quest.claimed || quest.completed ? 100 : percent}%` }}
        />
      </View>
    </View>
  )
}

export function QuestDetailSheet({
  quest,
  onClose,
  onClaim,
  claiming = false,
}: QuestDetailSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  /* Being handed a quest is what opens this. `ui/Sheet` holds on to the last
     content it was given while it animates shut, so the null that closes the
     sheet does not blank it out on the way down. */
  const open = quest !== null
  const action = quest ? questAction(quest) : null
  const claimable = quest !== null && quest.completed && !quest.claimed && onClaim !== undefined

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <>
          <AppText className="text-xl">{quest?.emoji ?? '🌱'}</AppText>
          <AppText weight="bold" numberOfLines={1} className="text-lg text-ink">
            {quest?.title ?? ''}
          </AppText>
        </>
      }
    >
      {quest ? (
        <>
          {/* Afi above the words, not beside them. The narration is a
              paragraph, and a paragraph set next to a 64pt mascot is a column
              about thirty characters wide: a tall thin ribbon that is harder
              to read the longer it gets. He keeps to the left rather than
              centring, so he reads as someone talking rather than as a second
              title over the text. */}
          <AfiPose
            pose={quest.claimed ? 'rozet' : 'merak'}
            motion="nefes"
            intro="giris"
            size={64}
          />
          <AppText className="mt-3 text-[15px] leading-6 text-ink">
            {questNarration(quest)}
          </AppText>

          {quest.claimed ? (
            <View className="mt-5 flex-row items-center gap-2 self-start rounded-full bg-emerald-100 px-3.5 py-1.5 dark:bg-emerald-900/50">
              <IconCheck size={16} color={isDark ? '#6ee7b7' : '#047857'} />
              <AppText weight="bold" className="text-sm text-emerald-800 dark:text-emerald-200">
                {quest.xpReward > 0
                  ? `Tamamladın · +${String(quest.xpReward)} tecrübe`
                  : 'Tamamladın'}
              </AppText>
            </View>
          ) : (
            <DetailProgress quest={quest} />
          )}

          {!quest.claimed && quest.xpReward > 0 ? (
            <View className="mt-3 flex-row items-center gap-1.5">
              <IconSparkles size={15} color={t.faint} />
              <AppText className="text-sm text-faint">
                Tamamlayınca +{String(quest.xpReward)} tecrübe
              </AppText>
            </View>
          ) : null}

          {claimable && onClaim ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${quest.title} görevini tamamla`}
              accessibilityState={{ disabled: claiming, busy: claiming }}
              disabled={claiming}
              onPress={() => onClaim(quest)}
              className={`mt-6 items-center rounded-2xl bg-emerald-600 py-3.5 active:opacity-90 ${
                claiming ? 'opacity-60' : ''
              }`}
            >
              <AppText weight="bold" className="text-white">
                {claiming ? 'Tamamlanıyor…' : 'Görevi tamamla'}
              </AppText>
            </Pressable>
          ) : null}

          {/* The starter is offered only while there is something left to do.
              A claimed quest keeps the route to itself: pointing someone at
              "Öğün ekle" under a finished quest reads as a chore, and the
              quest it belongs to is over. */}
          {action && !quest.claimed && !quest.completed ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={action.label}
              accessibilityHint={action.hint}
              onPress={() => {
                onClose()
                startQuestAction(action)
              }}
              className={`flex-row items-center justify-between rounded-2xl border border-line px-5 py-4 active:opacity-80 ${
                claimable ? 'mt-3' : 'mt-6'
              }`}
            >
              <AppText weight="bold" className="text-ink">
                {action.label}
              </AppText>
              <IconChevronRight size={18} color={t.faint} />
            </Pressable>
          ) : null}
        </>
      ) : null}
    </Sheet>
  )
}
