import * as Haptics from 'expo-haptics'
import { useState, type RefObject } from 'react'
import { Pressable, View } from 'react-native'
import { waterRepo } from '@/data/repositories'
import { claimQuest } from '@/features/progress/quests'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'
import { AfiScene } from '@/ui/maskot/AfiScene'
import { GuidedSpotlight } from './guided-spotlight'
import type { ChapterFlow } from './useChapterFlow'

/**
 * What each chapter looks like. One pattern per chapter, from the vocabulary
 * in docs/ftue.md, and never more than one on screen at a time.
 *
 * Two of them live here as an overlay (the spotlight and the scenes) and one
 * sits in the flow of the Bugün board, because a card that asks for a single
 * tap has no business dimming a screen to do it.
 */

interface ChapterOverlayProps {
  flow: ChapterFlow
  /** The nutrition card: what the first chapter points at. */
  mealCardRef: RefObject<View | null>
  /** Paused while a sheet of the app's own is open over the board. */
  paused?: boolean
}

export function ChapterOverlay({ flow, mealCardRef, paused = false }: ChapterOverlayProps) {
  if (paused) return null

  if (flow.current === 'balance') {
    return (
      <GuidedSpotlight
        stepKey="balance"
        targetRef={mealCardRef}
        pose="kasik"
        title="İlk kaydın sofrada 🌱"
        /* No count and no "1/4". The progress of this guide is a table being
           laid, and it is drawn in Görevlerim; a fraction here would turn the
           same thing into a checklist with three items still owed. */
        text="Kart canlandı: bu halkalar bugünün oranları, tutturulacak bir hedef değil. Karta dokun, hangi besin gruplarına dokunduğunu birlikte görelim."
        onDismiss={() => flow.dismiss('balance')}
      />
    )
  }

  if (flow.current === 'rhythm') {
    return <RhythmChapter flow={flow} />
  }

  if (flow.current === 'trail' && flow.claimable) {
    return <TrailChapter flow={flow} />
  }

  return null
}

/** The most important sentence in the app, said once, on the day it is true. */
function RhythmChapter({ flow }: { flow: ChapterFlow }) {
  return (
    <AfiScene
      pose="ritim"
      size={110}
      title="Ritmin başladı"
      body="İki gün oldu. afiet'te hedef her gün değil: haftada beş. Kalan iki gün senin sofra payın, kimse hesabını sormaz. Ben de sormam."
      actionLabel="Anladım"
      onAction={() => {
        flow.complete('rhythm')
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }}
      onClose={() => flow.dismiss('rhythm')}
    >
      <RhythmPreview />
    </AfiScene>
  )
}

/** Five days lit, two left deliberately open: the week as a promise, not a run. */
function RhythmPreview() {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const days = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']

  return (
    <View className="mt-5 w-full">
      <View className="flex-row justify-between gap-1.5">
        {days.map((day, index) => {
          const afiyet = index < 5
          return (
            <View key={day} className="flex-1 items-center gap-1.5">
              <View
                style={
                  afiyet
                    ? undefined
                    : { borderWidth: 1.5, borderColor: t.line, borderStyle: 'dashed' }
                }
                className={`h-8 w-full rounded-lg ${afiyet ? 'bg-emerald-500' : ''}`}
              />
              <AppText className="text-[10px] text-faint">{day}</AppText>
            </View>
          )
        })}
      </View>
      <AppText className="mt-2 text-center text-xs text-faint">
        Beş afiyet günü · iki gün sofra payı
      </AppText>
    </View>
  )
}

/**
 * The reward chapter, and the one that survives somebody refusing every
 * lesson: it does not explain anything, it hands over something already
 * earned. Görevlerim and Ligim open behind it.
 */
function TrailChapter({ flow }: { flow: ChapterFlow }) {
  const quest = flow.claimable
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!quest) return null

  const collect = () => {
    if (busy) return
    setBusy(true)
    setFailed(false)
    void claimQuest(quest.key)
      .then(() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        flow.complete('trail')
      })
      .catch(() => {
        /* Said out loud rather than swallowed: the reward may well have landed
           on the server, and a scene that goes quiet on failure is how a
           person ends up tapping a button that already worked. */
        setFailed(true)
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      })
      .finally(() => setBusy(false))
  }

  return (
    <AfiScene
      pose="rozet"
      size={106}
      title="Arkanda bir iz kalmış"
      body={
        failed
          ? `“${quest.title}” görevini şu an alamadım. Bağlantını kontrol edip tekrar dener misin?`
          : `“${quest.title}” çoktan tamamlanmış. Bunu sen yaptın, ben yalnız fark ettim.`
      }
      badge={quest.xpReward > 0 ? `+${String(quest.xpReward)} tecrübe` : undefined}
      actionLabel={failed ? 'Tekrar dene' : 'Al bakalım'}
      actionBusy={busy}
      onAction={collect}
      secondaryLabel="Sonra"
      onSecondary={() => flow.dismiss('trail')}
      onClose={() => flow.dismiss('trail')}
    />
  )
}

interface CloseDayCardProps {
  profileId: number
  date: string
  mealsToday: number
  coveredGroups: number
  flow: ChapterFlow
}

/**
 * The evening chapter, in the flow of the board rather than over it.
 *
 * It is also where the water row is born, and it opens it the honest way: the
 * button does the thing it is talking about, and the row appears underneath
 * with the glass already in it. Nobody is shown where a plus button lives and
 * then left to press it.
 */
export function CloseDayCard({
  profileId,
  date,
  mealsToday,
  coveredGroups,
  flow,
}: CloseDayCardProps) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const pour = () => {
    if (busy) return
    setBusy(true)
    setFailed(false)
    void waterRepo
      .forDay(profileId, date)
      .then((log) => waterRepo.setGlasses(profileId, date, (log?.glasses ?? 0) + 1))
      .then(() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        flow.complete('closeDay')
      })
      .catch(() => {
        setFailed(true)
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      })
      .finally(() => setBusy(false))
  }

  const summary =
    coveredGroups > 0
      ? `Bugün ${String(mealsToday)} kayıt, ${String(coveredGroups)} besin grubu.`
      : `Bugün ${String(mealsToday)} kayıt.`

  return (
    <View className="rounded-2xl bg-surface p-4">
      <View className="flex-row items-start gap-3">
        <AfiPose pose="su" size={54} />
        <View className="min-w-0 flex-1">
          <AppText weight="extrabold" className="text-ink">
            Günü kapatalım mı?
          </AppText>
          <AppText className="mt-1 text-sm leading-5 text-soft">
            {failed
              ? 'Bardağı ekleyemedim. Birazdan tekrar dener misin?'
              : `${summary} Bir de su var, hepimiz unutuyoruz.`}
          </AppText>
        </View>
      </View>

      <View className="mt-3 flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bir bardak su ekle ve günü kapat"
          accessibilityState={{ disabled: busy, busy }}
          disabled={busy}
          onPress={pour}
          className={`flex-1 items-center rounded-xl bg-emerald-600 py-3 active:opacity-90 ${
            busy ? 'opacity-60' : ''
          }`}
        >
          <AppText weight="bold" className="text-white">
            {busy ? 'Ekleniyor…' : failed ? 'Tekrar dene' : 'Bir bardak koy'}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bugün olmasın"
          onPress={() => flow.dismiss('closeDay')}
          className="items-center justify-center rounded-xl px-4 py-3"
        >
          <AppText weight="semibold" className="text-sm text-soft">
            Bugün olmasın
          </AppText>
        </Pressable>
      </View>
    </View>
  )
}
