import { KESE_PREMIUM_BONUS } from '@afiet/core'
import { router, type Href } from 'expo-router'
import { Pressable, View } from 'react-native'
import { usePremium } from '@/features/premium/usePremium'
import { AppText } from '@/ui/AppText'
import { IconChevronRight } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { keseRefreshLabel } from './keseCopy'
import { useKese } from './useKese'

/**
 * What sits above the composer once the week's kese is used up.
 *
 * Three things in one panel, in the order docs/13 sets: Afi says the week is
 * full, then when it refreshes, then the offer. Afi's line is written here and
 * never leaves the device, so a week that ran out costs nothing to explain.
 *
 * The tone is the requirement. Nothing here is locked, taken away or lost, and
 * Afi is not sad about it: he is out of words for the week and says so warmly,
 * which is the honest version of a wall the person can see anyway.
 *
 * Emerald, like every other place Afi invites rather than reports (the chat
 * rows on Bugün and Beslenme). A grey panel above the composer read as the
 * screen going quiet, which is the one thing this must not say.
 */
export function EmptyKese({ assistantName }: { assistantName: string }) {
  const kese = useKese()
  const { packages, isPremium } = usePremium()
  /* No offer, no door. A build whose store is not wired up yet, and every
     build on a platform we have not finished setting up, would otherwise send
     people to a paywall with no prices on it. */
  const offerPremium = packages.length > 0 && !isPremium
  if (!kese) return null

  return (
    <View className="mx-4 mb-2 rounded-2xl bg-emerald-600 p-4 dark:bg-emerald-700">
      <View className="flex-row items-center gap-3">
        <AfiPose pose="selam" size={52} tone="dark" />
        <AppText className="min-w-0 flex-1 text-sm leading-6 text-white">
          Bu haftalık sohbetimiz doldu. Kesen tazelenince kaldığımız yerden devam
          ederiz 🌿
        </AppText>
      </View>

      <AppText className="mt-3 text-xs text-emerald-50/90">
        {keseRefreshLabel(kese.refreshesAt)}
      </AppText>

      {offerPremium ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="afiet premium hakkında bilgi al"
          onPress={() => router.push('/premium' as Href)}
          className="mt-3 flex-row items-center gap-3 rounded-xl bg-white/15 p-3.5 active:bg-white/25"
        >
          <View className="min-w-0 flex-1">
            <AppText weight="bold" className="text-sm text-white">
              afiet premium
            </AppText>
            <AppText className="mt-0.5 text-xs text-emerald-50/90">
              Her hafta {KESE_PREMIUM_BONUS} mesaj daha: {assistantName} ve
              diğer sofra arkadaşlarınla rahatça konuş
            </AppText>
          </View>
          <IconChevronRight size={18} color="#ffffff" />
        </Pressable>
      ) : null}
    </View>
  )
}
