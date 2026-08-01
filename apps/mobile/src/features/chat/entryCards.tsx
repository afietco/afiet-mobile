import { router, type Href } from 'expo-router'
import { Pressable, View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { IconChevronRight } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'

/**
 * Beslenme tab entry into the nutrition conversation.
 *
 * Titled by what it is rather than by what it would like to talk about: this
 * is the dietitian, served as "kişisel beslenme uzmanım", and a card that only
 * offered to review your week read as one more note on a page full of notes.
 * It wears emerald for the same reason: it is an invitation on a screen of
 * readings, and the one thing here worth interrupting for.
 *
 * The proper name stays unpublished (pricing decision, see chat/assistants.ts).
 */
export function NutritionChatCard() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Kişisel beslenme uzmanınla sohbeti aç"
      onPress={() => router.push('/sohbet?asistan=beslenme' as Href)}
      className="flex-row items-center gap-3 rounded-2xl bg-emerald-600 p-4 active:bg-emerald-700 dark:bg-emerald-700 dark:active:bg-emerald-600"
    >
      <AfiPose pose="kasik" size={52} tone="dark" />
      <View className="min-w-0 flex-1">
        <AppText weight="bold" className="text-base text-white">
          Kişisel beslenme uzmanım
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
 * The support specialist, offered rather than left to be found.
 *
 * Its home is the foot of Vücudum, and only once Afi's acquaintance meter is
 * full. That gate is the whole idea: someone who has just handed over their
 * height and their weight has been answering questions about their body all
 * week, and this is the moment to say that the person on the other end of it
 * is not only there to measure. Earlier it would be one more thing to set up.
 *
 * Amber rather than emerald. It is as prominent as the nutrition card, but it
 * is not the same offer, and warmth is what this one has always been drawn in
 * (the mascot pose here is `sicaklik`, and the menu tints it the same way).
 */
export function SupportSpecialistCard() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Kişisel destek uzmanınla sohbeti aç"
      onPress={() => router.push('/sohbet?asistan=destek' as Href)}
      className="flex-row items-center gap-3 rounded-2xl bg-amber-500 p-4 active:bg-amber-600 dark:bg-amber-600 dark:active:bg-amber-500"
    >
      <AfiPose pose="sicaklik" size={52} tone="dark" />
      <View className="min-w-0 flex-1">
        <AppText weight="bold" className="text-base text-white">
          Kişisel destek uzmanım
        </AppText>
        <AppText className="text-xs text-amber-50/90">
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
      onPress={() => router.push('/sohbet?asistan=destek' as Href)}
      className="px-1 py-2"
    >
      <AppText className="text-center text-xs text-faint">
        Yemekle ilişkin seni zorluyorsa, konuşmak için buradayım.
      </AppText>
    </Pressable>
  )
}
