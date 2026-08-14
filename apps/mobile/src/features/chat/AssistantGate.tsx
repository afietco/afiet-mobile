import { router, type Href } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { trackTap } from '@/lib/track'
import { AppText } from '@/ui/AppText'
import { AssistantMascot } from './AssistantMascot'
import { ASSISTANTS } from './assistants'
import type { AssistantId } from './types'

/**
 * What Sini and Demi look like to somebody who has not bought afiet+.
 *
 * They are the thing afiet+ sells, so the door has to be shut. What it must
 * not be is a shut door with nothing written on it: a lock icon and a price
 * teaches nobody who Sini is, and asking for money before the character has
 * been introduced is how an offer becomes a wall.
 *
 * So this is an introduction rather than a paywall with a face. The mascot is
 * full size, the character says what they are for in their own words, and the
 * button is the last thing rather than the first. Afi is not here: he is free,
 * all day, and that is the whole point of the split.
 */

/** What each one is for, in the character's own register. */
const PITCH: Record<'beslenme' | 'destek', { lines: string[]; closing: string }> = {
  beslenme: {
    lines: [
      'Haftanın dengesine birlikte bakarız: hangi grup eksik kalmış, hangisi fazla gelmiş.',
      'Öğün fikri isterim dediğinde, senin sofrana göre söyler.',
      'Porsiyonları konuşuruz; sayı değil oran.',
    ],
    closing: 'Sinide her şeye yer var, mesele oran.',
  },
  destek: {
    lines: [
      'Yemekle ilişkin, suçluluk, tıkınma, kaçınma: konuşmak istediğin her şey.',
      'Acele etmez, yargılamaz, bir yere varmak zorunda değilsin.',
      'Sohbet saklanır ama yalnız senin ve onun yazdığı; ayrıca açık rızanı ister.',
    ],
    closing: 'Acele etmiyoruz, demlensin.',
  },
}

export function AssistantGate({ assistant }: { assistant: 'beslenme' | 'destek' }) {
  const insets = useSafeAreaInsets()
  const spec = ASSISTANTS[assistant as AssistantId]
  const pitch = PITCH[assistant]

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: 8,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 28,
      }}
    >
      <View className="items-center pt-4">
        <AssistantMascot assistant={assistant} size={128} />
        <AppText weight="extrabold" className="mt-3 text-2xl text-ink">
          {spec.title}
        </AppText>
        <AppText className="mt-1 text-center text-sm text-soft">{spec.subtitle}</AppText>
      </View>

      <View className="mt-7 gap-3">
        {pitch.lines.map((line) => (
          <View key={line} className="flex-row items-start gap-3">
            <AppText className="text-base">🌿</AppText>
            <AppText className="min-w-0 flex-1 text-sm leading-6 text-ink">{line}</AppText>
          </View>
        ))}
      </View>

      <AppText className="mt-6 text-center text-sm italic leading-6 text-soft">
        “{pitch.closing}”
      </AppText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`afiet+ ile ${spec.title} sohbetini aç`}
        onPress={() => {
          /* No property: which of the two gates somebody came through is not
             worth loosening the guard that keeps free text out of tap events,
             and reaching the premium screen is the step the funnel counts. */
          trackTap('assistant_gate_premium')
          router.push('/premium' as Href)
        }}
        className="mt-8 min-h-11 items-center rounded-xl bg-emerald-600 py-3.5 active:opacity-80"
      >
        <AppText weight="semibold" className="text-white">
          afiet+ ile aç
        </AppText>
      </Pressable>

      {/* Afi stays free and says so here, because the person reading this is
          being asked for money and deserves to know what they already have. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Afi ile sohbete dön"
        onPress={() => router.replace('/sohbet?asistan=afi' as Href)}
        className="mt-2 min-h-11 items-center justify-center py-3"
      >
        <AppText className="text-center text-xs leading-5 text-faint">
          Afi her zaman ücretsiz. Sofranla ilgili aklına takılanı ona sorabilirsin.
        </AppText>
      </Pressable>
    </ScrollView>
  )
}
