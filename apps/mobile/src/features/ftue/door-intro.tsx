import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { track } from '@/lib/track'
import { AppText } from '@/ui/AppText'
import { AfiPose, type AfiPoseName } from '@/ui/maskot'
import { CHAPTER_META, isSettled, teachingRetired, type ChapterKey } from './chapters'
import { markChapterDone, useChapterSnapshot } from './chapter-store'

/**
 * The chapter, met at its own door.
 *
 * The queue brings each chapter to Bugün on its day, but somebody who explores
 * finds the screen first: Menüm from the add-food flow, Vücudum from the tab,
 * Grubum from the tab bar. Reaching the room is as good as being walked to it,
 * so the room says what the chapter would have said and lets the person open
 * the door from here. Nothing is asked twice: once the chapter is settled, by
 * this card, by Bugün or by doing the thing, the card is gone.
 */

const INTROS: Partial<Record<ChapterKey, { pose: AfiPoseName; body: string; action: string }>> = {
  menu: {
    pose: 'buldum',
    body: 'Sık kurduğun sofrayı bir kez kaydet, bir daha tek tek yazma. Burası onun yeri; Bugün panosunda da kapısı açılsın mı?',
    action: 'Menüm’ü panoya al',
  },
  direction: {
    pose: 'merak',
    body: 'Burada senden kilo hedefi istemem; yalnız yönünü sorarım, fikrin değişirse birlikte değiştiririz. Bugün panosunda da yerini açalım mı?',
    action: 'Vücudum’u panoya al',
  },
  circle: {
    pose: 'aile',
    body: 'Sofra kalabalık olunca daha kolay olur. Grubun burada kurulur; Bugün panosunda da kapısı açılsın mı?',
    action: 'Grubum’u panoya al',
  },
  team: {
    pose: 'selam',
    body: 'Ben her gün buradayım, ücretsiz. Yanımda Sini ve Demi var, onlar afiet+ ile geliyor. Bugün panosunda da satırım açılsın mı?',
    action: 'Afi’yi panoya al',
  },
  trail: {
    pose: 'rozet',
    body: 'Görevler yapılacak iş değil, bıraktığın iz. Görevlerim ve Ligim Bugün panosunda da görünsün mü?',
    action: 'Panoya al',
  },
}

export function ChapterDoorIntro({ chapter }: { chapter: ChapterKey }) {
  const { record } = useChapterSnapshot()
  const [opened, setOpened] = useState(false)
  const intro = INTROS[chapter]
  if (!intro || !record || record.established) return null
  if (!opened && (isSettled(record, chapter) || teachingRetired(record))) return null

  const meta = CHAPTER_META[chapter]

  const open = () => {
    if (opened) return
    setOpened(true)
    markChapterDone(chapter)
    track('afi_guide_completed', { step: chapter, from: 'screen' })
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  if (opened) {
    return (
      <View
        accessibilityLiveRegion="polite"
        className="mb-4 flex-row items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-3 dark:bg-emerald-700"
      >
        <AfiPose pose="kutlama" size={40} tone="dark" />
        <View className="min-w-0 flex-1">
          <AppText weight="extrabold" className="text-white">
            {`Sofraya yeni parça 🎉 ${meta.title}`}
          </AppText>
          <AppText className="text-xs text-emerald-50/90">
            {meta.door ? `${meta.door} Bugün panosunda açıldı` : 'Sofra biraz daha kuruldu'}
          </AppText>
        </View>
      </View>
    )
  }

  return (
    <View className="mb-4 rounded-2xl bg-surface p-4">
      <View className="flex-row items-start gap-3">
        <AfiPose pose={intro.pose} size={54} />
        <View className="min-w-0 flex-1">
          <AppText weight="extrabold" className="text-ink">
            {meta.title}
          </AppText>
          <AppText className="mt-1 text-sm leading-5 text-soft">{intro.body}</AppText>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={intro.action}
        onPress={open}
        className="mt-3 items-center rounded-xl bg-emerald-600 py-3 active:opacity-90"
      >
        <AppText weight="bold" className="text-white">
          {intro.action}
        </AppText>
      </Pressable>
    </View>
  )
}
