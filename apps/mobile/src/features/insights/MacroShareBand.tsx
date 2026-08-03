/**
 * Where each macro sits against its reference band.
 *
 * A share of energy rather than a distance from a target, on purpose: a share
 * cannot be exceeded, so nothing here can turn into a verdict on the person.
 * The band is drawn as ground and the value as a marker on it, which is also
 * the honest shape for guidance that has real width (MACRO_RANGES) and a
 * calculation with a wide error margin behind it.
 */
import type { MacroShare } from '@afiet/core'
import { View } from 'react-native'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'

const LABELS: Record<MacroShare['key'], string> = {
  protein: 'Protein',
  carb: 'Karbonhidrat',
  fat: 'Yağ',
}

/** Mirrors MacroRings so a macro keeps its color across the app. */
const COLORS: Record<MacroShare['key'], [string, string]> = {
  protein: ['#fb923c', '#fb923c'],
  carb: ['#fbbf24', '#fbbf24'],
  fat: ['#84cc16', '#a3e635'],
}

const percent = (value: number) => `%${Math.round(value * 100)}`

function Row({ share }: { share: MacroShare }) {
  const { isDark } = useTheme()
  const color = COLORS[share.key][isDark ? 1 : 0]
  const inside = share.position === 'inside'

  return (
    <View className="gap-1.5">
      <View className="flex-row items-baseline justify-between">
        <AppText weight="semibold" className="text-sm text-ink">
          {LABELS[share.key]}
        </AppText>
        <View className="flex-row items-baseline gap-2">
          <AppText weight="extrabold" className="text-base text-ink">
            {percent(share.share)}
          </AppText>
          <AppText className="text-xs text-faint">
            {percent(share.min)}-{percent(share.max)} arası
          </AppText>
        </View>
      </View>

      {/* Track runs the full 0-100% of energy so the three rows stay comparable
          and the band keeps its true width instead of being zoomed to fit. */}
      <View className="h-3 flex-row overflow-hidden rounded-full bg-muted">
        <View style={{ flex: share.min }} />
        <View
          style={{ flex: share.max - share.min, backgroundColor: color, opacity: 0.28 }}
        />
        <View style={{ flex: 1 - share.max }} />
      </View>

      {/* The marker rides on its own row under the track, so an out-of-band
          value stays legible instead of being clipped by the band fill. */}
      <View className="h-2 flex-row">
        <View style={{ flex: Math.max(share.share, 0.001) }} />
        <View
          className="h-2 w-2 rounded-full"
          style={{
            marginLeft: -4,
            backgroundColor: inside ? color : isDark ? '#fbbf24' : '#b45309',
          }}
        />
        <View style={{ flex: Math.max(1 - share.share, 0.001) }} />
      </View>
    </View>
  )
}

export function MacroShareBand({ shares }: { shares: MacroShare[] }) {
  if (shares.length === 0) return null

  return (
    <View className="rounded-2xl bg-surface p-5">
      <AppText weight="bold" className="mb-1 text-ink">
        Makro dağılımın
      </AppText>
      <AppText className="mb-4 text-xs leading-5 text-faint">
        Yediklerinin enerjisi protein, karbonhidrat ve yağ arasında nasıl
        paylaşılmış. Soluk şerit dengeli bir günün geçtiği aralık; nokta senin
        payın. Aralığın dışında olmak bir hata değil, yalnızca bilgi.
      </AppText>
      <View className="gap-4">
        {shares.map((share) => (
          <Row key={share.key} share={share} />
        ))}
      </View>
    </View>
  )
}
