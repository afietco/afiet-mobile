import { Pressable, Text, View } from 'react-native'
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated'
import { AppText } from '@/ui/AppText'
import { dismissReceived, useGreetings } from './greetings'

/**
 * Bugün'de alınan "afiyet olsun" kartı. Yumuşak, tek seferlik: dokununca
 * kaybolur, cevap beklenmez (aile-sofrasi.md). Birden fazla gönderen tek
 * cümlede birleşir: "Ayşe ve Deniz afiyet olsun dedi".
 */

/** "Ayşe" / "Ayşe ve Deniz" / "Ayşe, Deniz ve Ali" */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} ve ${names[names.length - 1]}`
}

export function GreetingReceivedCard() {
  const { received } = useGreetings()
  if (!received || received.fromNames.length === 0) return null

  return (
    <Animated.View entering={FadeInDown.duration(250)} exiting={FadeOut.duration(200)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${joinNames(received.fromNames)} afiyet olsun dedi, kapatmak için dokun`}
        onPress={dismissReceived}
        className="mb-3 flex-row items-center gap-3 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/50"
      >
        <Text style={{ fontSize: 22, lineHeight: 28 }}>🧡</Text>
        <View className="min-w-0 flex-1">
          <AppText weight="semibold" className="text-sm text-emerald-800 dark:text-emerald-200">
            {joinNames(received.fromNames)} afiyet olsun dedi
          </AppText>
        </View>
      </Pressable>
    </Animated.View>
  )
}
