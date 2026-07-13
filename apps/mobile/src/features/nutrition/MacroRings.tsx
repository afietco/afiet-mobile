import type { ApiSummary } from '@/data/api/client'
import type { FC } from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconEgg, IconFlame, IconOlive, IconWheat, type IconProps } from '@/ui/icons'

/** [açık, koyu] hex — web MacroRings.tsx'teki text-* sınıflarının karşılığı */
const RINGS: {
  key: 'kcal' | 'protein' | 'carb' | 'fat'
  label: string
  Icon: FC<IconProps>
  color: [string, string]
}[] = [
  { key: 'kcal', label: 'Enerji', Icon: IconFlame, color: ['#8b5cf6', '#a78bfa'] },
  { key: 'protein', label: 'Protein', Icon: IconEgg, color: ['#fb923c', '#fb923c'] },
  { key: 'carb', label: 'Karb.', Icon: IconWheat, color: ['#fbbf24', '#fbbf24'] },
  { key: 'fat', label: 'Yağ', Icon: IconOlive, color: ['#84cc16', '#a3e635'] },
]

const R = 15.5
const C = 2 * Math.PI * R

function Ring({
  pct,
  color,
  track,
  Icon,
}: {
  pct: number
  color: string
  track: string
  Icon: FC<IconProps>
}) {
  const filled = (Math.min(100, pct) / 100) * C
  return (
    <View style={{ width: 48, height: 48 }}>
      <Svg width={48} height={48} viewBox="0 0 36 36" style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={18} cy={18} r={R} fill="none" strokeWidth={2.6} stroke={track} />
        <Circle
          cx={18}
          cy={18}
          r={R}
          fill="none"
          strokeWidth={2.6}
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={`${filled} ${C}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} className="items-center justify-center">
        <Icon size={22} color={color} />
      </View>
    </View>
  )
}

/**
 * 4 makro halkası (enerji + protein/karb/yağ). Değerler backend'den gelir
 * (summary.nutrition = günün toplamı, summary.targets = hedefler) — istemci
 * hesaplamaz, gösterir.
 */
export function MacroRings({
  nutrition,
  targets,
}: {
  nutrition: ApiSummary['nutrition']
  targets: ApiSummary['targets']
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']

  return (
    <View className="flex-row justify-between gap-1">
      {RINGS.map((ring) => {
        const max = ring.key === 'kcal' ? targets.energyKcal : targets[ring.key]
        const pct = max > 0 ? (nutrition[ring.key] / max) * 100 : 0
        const color = ring.color[isDark ? 1 : 0]
        return (
          <View key={ring.key} className="flex-1 items-center gap-1">
            <Ring pct={pct} color={color} track={t.muted} Icon={ring.Icon} />
            <AppText
              weight={pct > 0 ? 'semibold' : 'normal'}
              className="text-[10px]"
              style={{ color: pct > 0 ? color : t.faint }}
            >
              {ring.label}
            </AppText>
          </View>
        )
      })}
    </View>
  )
}
