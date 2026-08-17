import * as Haptics from 'expo-haptics'
import { router, type Href } from 'expo-router'
import { useEffect, useState, type ReactNode, type RefObject } from 'react'
import { Linking, Pressable, Share, View } from 'react-native'
import { waterRepo } from '@/data/repositories'
import { claimQuest } from '@/features/progress/quests'
import {
  getPushPermissionState,
  requestPushPermission,
  type PushPermissionState,
} from '@/features/push/push-notifications'
import { useMyFriendCode } from '@/features/social/store'
import { trackTap } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { AfiPose, type AfiPoseName } from '@/ui/maskot'
import { AfiScene } from '@/ui/maskot/AfiScene'
import { DemiPose, SiniPose } from '@/ui/maskot/sofra'
import type { TableAnswer } from './chapters'
import { useChapterSnapshot } from './chapter-store'
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
  /** A food without macros was logged today; the team chapter opens on it. */
  unknownToday?: boolean
}

export function ChapterOverlay({
  flow,
  mealCardRef,
  paused = false,
  unknownToday = false,
}: ChapterOverlayProps) {
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

  if (flow.current === 'trail') {
    return flow.claimable ? <TrailChapter flow={flow} /> : <TrailReplay flow={flow} />
  }

  if (flow.current === 'circle') {
    return <CircleChapter flow={flow} />
  }

  if (flow.current === 'team') {
    return <TeamChapter flow={flow} unknownToday={unknownToday} />
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

/**
 * The reward chapter asked for again when nothing is waiting to be collected.
 * There is no reward to hand over, so it points at where rewards gather; the
 * queue itself never draws this, only a replay does.
 */
function TrailReplay({ flow }: { flow: ChapterFlow }) {
  return (
    <AfiScene
      pose="rozet"
      size={100}
      title="Yolculuğun izi"
      body="Şu an alınacak bir görev yok; iz burada, Görevlerim'de birikir. Bir görev hazır olduğunda önce ben söylerim."
      actionLabel="Görevlerim'e git"
      onAction={() => {
        flow.complete('trail')
        router.push('/gorevlerim')
      }}
      secondaryLabel="Kapat"
      onSecondary={() => flow.dismiss('trail')}
      onClose={() => flow.dismiss('trail')}
      confetti={false}
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

/**
 * The shape shared by the chapters that sit in the flow of the board: Afi at
 * the left, one line of title, a sentence or two, and a primary button next to
 * the quiet way out. The closing chapter drew it first; the sofra, the
 * direction and the return use the same frame so the board reads as one voice.
 */
export function ChapterCard({
  pose,
  title,
  body,
  primaryLabel,
  primaryAccessibilityLabel,
  onPrimary,
  primaryBusy = false,
  secondaryLabel,
  onSecondary,
  extra,
}: {
  pose: AfiPoseName
  title: string
  body: string
  primaryLabel: string
  primaryAccessibilityLabel?: string
  onPrimary: () => void
  primaryBusy?: boolean
  secondaryLabel: string
  onSecondary: () => void
  /** Optional second row of actions, drawn between the text and the buttons. */
  extra?: ReactNode
}) {
  return (
    <View className="rounded-2xl bg-surface p-4">
      <View className="flex-row items-start gap-3">
        <AfiPose pose={pose} size={54} />
        <View className="min-w-0 flex-1">
          <AppText weight="extrabold" className="text-ink">
            {title}
          </AppText>
          <AppText className="mt-1 text-sm leading-5 text-soft">{body}</AppText>
        </View>
      </View>

      {extra}

      <View className="mt-3 flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={primaryAccessibilityLabel ?? primaryLabel}
          accessibilityState={{ disabled: primaryBusy, busy: primaryBusy }}
          disabled={primaryBusy}
          onPress={onPrimary}
          className={`flex-1 items-center rounded-xl bg-emerald-600 py-3 active:opacity-90 ${
            primaryBusy ? 'opacity-60' : ''
          }`}
        >
          <AppText weight="bold" className="text-white">
            {primaryLabel}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel}
          onPress={onSecondary}
          className="items-center justify-center rounded-xl px-4 py-3"
        >
          <AppText weight="semibold" className="text-sm text-soft">
            {secondaryLabel}
          </AppText>
        </Pressable>
      </View>
    </View>
  )
}

/**
 * "Sofranı tanı": the same food has been written on more than one day, so a
 * saved sofra would now save something. The button hands the repeated foods
 * to the sofra editor with the name and the meal already filled in; the
 * chapter ends when that sofra is saved, not when the editor opens.
 */
export function MenuChapterCard({
  flow,
  onBuild,
  building,
}: {
  flow: ChapterFlow
  /** Opens the sofra editor with the offered draft. */
  onBuild: () => void
  building: boolean
}) {
  const draft = flow.sofraDraft
  if (!draft) {
    /* A replay with nothing repeating yet: the door is shown instead of the
       offer, and the chapter is spent on the visit rather than on a save. */
    return (
      <ChapterCard
        pose="buldum"
        title="Sofranı tanı"
        body="Aynı besini iki ayrı gün yazdığında sık kurduğun sofrayı bir dokunuşla kaydetmeyi öneririm. Menüm'de kendin de kurabilirsin."
        primaryLabel="Menüm'e git"
        onPrimary={() => {
          flow.complete('menu')
          router.push('/menum')
        }}
        secondaryLabel="Kapat"
        onSecondary={() => flow.dismiss('menu')}
      />
    )
  }
  const lead = draft.foods[0]?.name ?? 'aynı şeyleri'
  const others = draft.foods.length - 1

  return (
    <ChapterCard
      pose="buldum"
      title="Aynı sofrayı yine kurdun 🙂"
      body={
        others > 0
          ? `${lead} ve ${String(others)} besin daha birkaç günde bir yazılıyor. Sık kurduğun sofrayı bir kez kaydet, bir daha tek tek yazma.`
          : `${lead} birkaç günde bir yazılıyor, gördüm. Sık kurduğun sofrayı bir kez kaydet, bir daha tek tek yazma.`
      }
      primaryLabel={building ? 'Hazırlanıyor…' : 'Sofrayı kur'}
      primaryBusy={building}
      onPrimary={onBuild}
      secondaryLabel="Şimdilik değil"
      onSecondary={() => flow.dismiss('menu')}
    />
  )
}

/**
 * "Yönün": the body questions, moved here from the first session and asked as
 * a direction rather than a target. The card only opens the setup sheet the
 * app already has; the chapter ends when that sheet saves.
 */
export function DirectionChapterCard({
  flow,
  onOpen,
}: {
  flow: ChapterFlow
  onOpen: () => void
}) {
  return (
    <ChapterCard
      pose="merak"
      title="Yönün hangisi?"
      body="Burada senden kilo hedefi istemeyeceğim, tarih de yok. Yalnız yönünü soracağım; fikrin değişirse birlikte değiştiririz. Birkaç kısa soru, hepsi bu."
      primaryLabel="Yönümü seç"
      onPrimary={onOpen}
      secondaryLabel="Sonra"
      onSecondary={() => flow.dismiss('direction')}
    />
  )
}

/**
 * "Sofranı hatırlat": the person has been away for days and is back. Nothing
 * is owed and nothing was lost; the card offers the two things that make the
 * next return easier, the widget and, if it was left open, one last quiet
 * question about being called. Somebody who said no to the system dialog is
 * not asked again by us; the button takes them to Ayarlar and says so.
 */
export function RemindCard({
  flow,
  awayDays,
  onWidget,
}: {
  flow: ChapterFlow
  awayDays: number
  onWidget: () => void
}) {
  const [permission, setPermission] = useState<PushPermissionState | null>(null)
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    let alive = true
    void getPushPermissionState()
      .then((state) => alive && setPermission(state))
      .catch(() => alive && setPermission('unavailable'))
    return () => {
      alive = false
    }
  }, [])

  const askable = permission === 'undetermined'
  const settingsOnly = permission === 'denied'

  const call = () => {
    if (asking) return
    if (settingsOnly) {
      trackTap('remind_open_settings')
      void Linking.openSettings().catch(() => undefined)
      flow.complete('remind')
      return
    }
    setAsking(true)
    void requestPushPermission()
      .catch(() => 'unavailable' as const)
      .then((state) => {
        setPermission(state)
        // Either answer to the system is an answer; the chapter has done its part.
        flow.complete('remind')
      })
      .finally(() => setAsking(false))
  }

  /* Asked for again from the guide, there is no return to speak of; the
     offers still stand, so the card only drops the welcome. */
  const returned = awayDays > 0
  /* The sentence counts what the card actually offers: the widget alone when
     the permission question is settled, the widget and the call otherwise. */
  const ways = askable || settingsOnly ? 'iki küçük yol var' : 'küçük bir yol var: ritim widget’ı'

  return (
    <ChapterCard
      pose="selam"
      title={returned ? 'Sofra seni bekliyordu 🥣' : 'Sofra hep burada 🥣'}
      body={
        returned
          ? `${String(awayDays)} gün olmuş, sorun değil: sofra bir yere gitmedi, ben de. Bir daha aramak zorunda kalma diye ${ways}.`
          : `Bir daha aramak zorunda kalma diye ${ways}.`
      }
      primaryLabel="Widget’ı ekle"
      onPrimary={onWidget}
      secondaryLabel="Sonra"
      onSecondary={() => flow.dismiss('remind')}
      extra={
        askable || settingsOnly ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              settingsOnly ? 'Bildirimleri Ayarlar’dan aç' : 'Sofran beklerken bir kez seslen'
            }
            accessibilityState={{ disabled: asking, busy: asking }}
            disabled={asking}
            onPress={call}
            className="mt-3 flex-row items-center gap-3 rounded-xl bg-emerald-50 px-3 py-2.5 active:opacity-80 dark:bg-emerald-950/40"
          >
            <AppText className="min-w-0 flex-1 text-sm leading-5 text-emerald-900 dark:text-emerald-100">
              {settingsOnly
                ? 'Sesleneyim dersen bildirimler telefon ayarlarından açılıyor.'
                : 'İstersen sofran beklerken bir kez seslenebilirim.'}
            </AppText>
            <AppText weight="bold" className="text-sm text-emerald-700 dark:text-emerald-300">
              {asking ? '…' : settingsOnly ? 'Ayarlar' : 'Seslen'}
            </AppText>
          </Pressable>
        ) : null
      }
    />
  )
}

const CIRCLE_BODY: Record<TableAnswer, string> = {
  solo: 'İlk ritim haftan doldu 🎉 Sofra kalabalık olunca daha kolay olur. Birini çağıralım mı?',
  partner: 'Eşinle aynı sofradasınız; burada da yan yana olun. Bir davet yeter.',
  family: 'Ailece kurulan sofra burada da kalabalık olsun. Bir davetle hepsi gelir.',
}

/**
 * "Sofrada yalnız değilsin": the social chapter. Its shape depends on how the
 * person arrived. Through an invitation, the group is already there and the
 * scene simply walks them to it. On their own, the one-tap action is the
 * person's own friend code on the system share sheet; the chapter ends when
 * something was actually shared, not when the sheet merely opened.
 */
function CircleChapter({ flow }: { flow: ChapterFlow }) {
  const { record } = useChapterSnapshot()
  const code = useMyFriendCode()
  const [busy, setBusy] = useState(false)
  const invited = record?.invited === true && !flow.hasGroup

  if (invited) {
    return (
      <AfiScene
        pose="aile"
        size={110}
        title="Sofran çoktan kurulmuş"
        body="Bir davetle geldin: seni bekleyen bir grup var. Girelim mi?"
        actionLabel="Gruba git"
        onAction={() => {
          flow.complete('circle')
          router.push('/grubum')
        }}
        secondaryLabel="Sonra"
        onSecondary={() => flow.dismiss('circle')}
        onClose={() => flow.dismiss('circle')}
      />
    )
  }

  const share = () => {
    if (busy) return
    if (!code) {
      // No code to share yet: the friends screen has the same door and waits for it.
      flow.complete('circle')
      router.push('/arkadaslarim' as Href)
      return
    }
    setBusy(true)
    trackTap('friend_code_share', { from: 'ftue_circle' })
    void Share.share({ message: `afiet'te beni arkadaş kodumla ekleyebilirsin: ${code}` })
      .then((result) => {
        if (result.action === Share.sharedAction) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          flow.complete('circle')
        }
      })
      .catch(() => undefined)
      .finally(() => setBusy(false))
  }

  return (
    <AfiScene
      pose="aile"
      size={110}
      title="Sofrada yalnız değilsin"
      body={CIRCLE_BODY[record?.table ?? 'solo']}
      actionLabel={code ? 'Davet gönder' : 'Arkadaşlarım’ı aç'}
      actionBusy={busy}
      onAction={share}
      secondaryLabel="Sonra"
      onSecondary={() => flow.dismiss('circle')}
      onClose={() => flow.dismiss('circle')}
    />
  )
}

/**
 * "Sofra takımı": Afi introduces the two who come with afiet+. An
 * introduction, not a paywall: the button opens the assistants screen, where
 * the three of them already stand side by side, and nothing here sells.
 */
function TeamChapter({ flow, unknownToday }: { flow: ChapterFlow; unknownToday: boolean }) {
  const lead = unknownToday ? 'Bilmediğim bir şey yazdın, sorun değil. ' : ''
  return (
    <AfiScene
      pose="selam"
      size={104}
      title="Sofra takımıyla tanış"
      body={`${lead}Ben buradayım, her gün, ücretsiz. Yanımda iki kişi daha var: Sini beslenmeyi konuşur, Demi yemekle ilişkini. Onlar afiet+ ile geliyor.`}
      actionLabel="Tanışalım"
      onAction={() => {
        flow.complete('team')
        router.push('/yapay-zeka' as Href)
      }}
      secondaryLabel="Sonra"
      onSecondary={() => flow.dismiss('team')}
      onClose={() => flow.dismiss('team')}
      confetti={false}
    >
      <View className="mt-4 flex-row items-end justify-center gap-6">
        <View className="items-center gap-1">
          <SiniPose size={64} accessibilityLabel="Sini" />
          <AppText weight="semibold" className="text-xs text-soft">
            Sini
          </AppText>
        </View>
        <View className="items-center gap-1">
          <DemiPose size={64} accessibilityLabel="Demi" />
          <AppText weight="semibold" className="text-xs text-soft">
            Demi
          </AppText>
        </View>
      </View>
    </AfiScene>
  )
}
