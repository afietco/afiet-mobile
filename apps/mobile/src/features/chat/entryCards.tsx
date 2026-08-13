import { router, type Href } from 'expo-router'
import { Pressable, View } from 'react-native'
import { trackTap } from '@/lib/track'
import { AppText } from '@/ui/AppText'
import { IconChevronRight } from '@/ui/icons'
import { DemiPose, SiniPose } from '@/ui/maskot/sofra'

/**
 * Beslenme tab entry into the nutrition conversation.
 *
 * Named after the character who answers it rather than after a job title: this
 * is Sini, the tray, and a card that only offered to review your week read as
 * one more note on a page full of notes. It wears emerald for the same reason:
 * it is an invitation on a screen of readings, and the one thing here worth
 * interrupting for.
 */
export function NutritionChatCard() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sini ile sohbeti aç"
      onPress={() => {
        trackTap('chat_entry', { from: 'nutrition_card', assistant: 'beslenme' })
        router.push('/sohbet?asistan=beslenme' as Href)
      }}
      className="flex-row items-center gap-3 rounded-2xl bg-emerald-600 p-4 active:bg-emerald-700 dark:bg-emerald-700 dark:active:bg-emerald-600"
    >
      <SiniPose size={52} />
      <View className="min-w-0 flex-1">
        <AppText weight="bold" className="text-base text-white">
          Sini
        </AppText>
        <AppText className="text-xs text-emerald-50/90">
          Haftanı birlikte değerlendirelim: denge, öğün fikirleri, porsiyonlar.
        </AppText>
      </View>
      <IconChevronRight size={18} color="#ffffff" />
    </Pressable>
  )
}

/**
 * Demi, offered rather than left to be found.
 *
 * It opens Vücudum, and it is there from the first visit. Gating it behind a
 * full acquaintance meter was the wrong reading of who needs it: someone at
 * the beginning of all this, with an empty screen and four things left to
 * enter, is not less likely to want to talk than someone who finished.
 *
 * Violet, which is this screen's own colour: the offer belongs to the page it
 * stands on rather than arriving from somewhere else, and it is the first
 * thing said on a screen that otherwise speaks entirely in measurements.
 */
export function SupportSpecialistCard() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Demi ile sohbeti aç"
      onPress={() => {
        trackTap('chat_entry', { from: 'body_card', assistant: 'destek' })
        router.push('/sohbet?asistan=destek' as Href)
      }}
      className="flex-row items-center gap-3 rounded-2xl bg-violet-600 p-4 active:bg-violet-700 dark:bg-violet-700 dark:active:bg-violet-600"
    >
      <DemiPose size={52} tone="dark" />
      <View className="min-w-0 flex-1">
        <AppText weight="bold" className="text-base text-white">
          Demi
        </AppText>
        <AppText className="text-xs text-violet-50/90">
          Ölçüler kadar hissettiklerin de önemli. Konuşmak istediğinde buradayım.
        </AppText>
      </View>
      <IconChevronRight size={18} color="#ffffff" />
    </Pressable>
  )
}

/** Quiet doorway to the destek conversation; deliberately understated. */
export function SupportChatRow() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Destek sohbetini aç"
      onPress={() => {
        trackTap('chat_entry', { from: 'body_row', assistant: 'destek' })
        router.push('/sohbet?asistan=destek' as Href)
      }}
      className="px-1 py-2"
    >
      <AppText className="text-center text-xs text-faint">
        Yemekle ilişkin seni zorluyorsa, konuşmak için buradayım.
      </AppText>
    </Pressable>
  )
}
