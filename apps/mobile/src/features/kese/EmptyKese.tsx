import { KESE_PREMIUM_BONUS } from '@afiet/core'
import { Pressable, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
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
 */
export function EmptyKese({ assistantName }: { assistantName: string }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const kese = useKese()

  return (
    <View className="mx-4 mb-2 rounded-2xl bg-surface p-4">
      <View className="flex-row items-center gap-3">
        <AfiPose pose="selam" size={52} />
        <AppText className="min-w-0 flex-1 text-sm leading-6 text-ink">
          Bu haftalık sohbetimiz doldu. Kesen tazelenince kaldığımız yerden devam
          ederiz 🌿
        </AppText>
      </View>

      <AppText className="mt-3 text-xs text-faint">
        {keseRefreshLabel(kese.refreshesAt)}
      </AppText>

      {/* TODO(kese): fiyat politikası park edildiği için teklif henüz bir yere
          gitmiyor; premium ekranı açılınca buradan oraya bağlanacak. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="afiet premium hakkında bilgi al"
        className="mt-3 flex-row items-center gap-3 rounded-xl bg-canvas p-3.5 active:opacity-80"
      >
        <View className="min-w-0 flex-1">
          <AppText weight="bold" className="text-sm text-ink">
            afiet premium
          </AppText>
          <AppText className="mt-0.5 text-xs text-soft">
            Her hafta {KESE_PREMIUM_BONUS} mesaj daha, {assistantName} ve diğer
            sofra arkadaşların için
          </AppText>
        </View>
        <IconChevronRight size={18} color={t.faint} />
      </Pressable>
    </View>
  )
}
