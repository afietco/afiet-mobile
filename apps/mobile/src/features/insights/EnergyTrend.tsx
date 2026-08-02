/**
 * Daily energy with a trailing average drawn over it.
 *
 * The average is the line worth reading; the dots are there to show how much
 * noise it is smoothing. Days with no record leave a gap rather than a dip,
 * because a day nobody logged is not a day of eating nothing.
 *
 * Deliberately without a target line. A horizontal "this is your number" rule
 * turns every dot above it into a small failure, which is the exact reading
 * BRAND.md rules out for energy.
 */
import { roundEnergy, type TrendPoint } from '@afiet/core'
import { useState } from 'react'
import { View } from 'react-native'
import Svg, { Circle, Defs, Line, LinearGradient, Polygon, Polyline, Stop } from 'react-native-svg'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'

const HEIGHT = 120
const PADDING_TOP = 8
const PADDING_BOTTOM = 12
/** Keeps the first and last dot from being clipped by the card edge. */
const PADDING_X = 4

export function EnergyTrend({
  points,
  averageKcal,
}: {
  points: TrendPoint[]
  /** Window mean, shown as the one number worth carrying away. */
  averageKcal: number | null
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const violet = isDark ? '#a78bfa' : '#7c3aed'
  /* Measured rather than given a viewBox: a stretched viewBox scales x and y
     by different factors, which turns every dot into a dash and thins the
     line unevenly. */
  const [width, setWidth] = useState(0)

  const values = points.map((p) => p.value).filter((v): v is number => v !== null)
  if (values.length === 0) return null

  /* The scale starts at zero rather than at the lowest day: an auto-zoomed
     axis makes ordinary variation look like a cliff, and this chart is meant
     to say the opposite. */
  const max = Math.max(...values) * 1.12
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const plotWidth = Math.max(0, width - PADDING_X * 2)
  const x = (index: number) =>
    PADDING_X + (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth)
  const y = (value: number) => PADDING_TOP + plotHeight - (value / max) * plotHeight

  /* Consecutive runs only: a gap in the record breaks the line instead of
     being bridged with a straight segment that never happened. */
  const runs: string[] = []
  let current: string[] = []
  for (const [index, point] of points.entries()) {
    if (point.average === null) {
      if (current.length > 1) runs.push(current.join(' '))
      current = []
      continue
    }
    current.push(`${x(index)},${y(point.average)}`)
  }
  if (current.length > 1) runs.push(current.join(' '))

  /* The axis starts at zero, which leaves a wide empty band under the line.
     Filling it turns that space into the quantity it represents instead of
     leaving it reading as missing data. */
  const baseline = PADDING_TOP + plotHeight
  const areas = runs.map((run) => {
    const first = run.slice(0, run.indexOf(','))
    const last = run.slice(run.lastIndexOf(' ') + 1)
    const lastX = last.slice(0, last.indexOf(','))
    return `${first},${baseline} ${run} ${lastX},${baseline}`
  })

  return (
    <View className="rounded-2xl bg-surface p-5">
      <View className="mb-1 flex-row items-baseline justify-between">
        <AppText weight="bold" className="text-ink">
          Enerji akışın
        </AppText>
        {averageKcal !== null ? (
          <AppText weight="extrabold" className="text-base text-ink">
            ~{roundEnergy(averageKcal).toLocaleString('tr-TR')}
            <AppText className="text-xs text-faint"> kcal/gün</AppText>
          </AppText>
        ) : null}
      </View>
      <AppText className="mb-4 text-xs leading-5 text-faint">
        Noktalar günleri, çizgi 7 günlük ortalamayı gösterir. Takip edilmesi
        gereken çizgidir; günlük iniş çıkış çoğunlukla pazar alışverişi ve
        iştahtır, beslenme biçiminin değişmesi değil.
      </AppText>

      <View
        style={{ height: HEIGHT }}
        onLayout={(event) => {
          const next = Math.round(event.nativeEvent.layout.width)
          if (next !== width) setWidth(next)
        }}
      >
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            <Defs>
              <LinearGradient id="enerjiAlan" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={violet} stopOpacity={0.22} />
                <Stop offset="1" stopColor={violet} stopOpacity={0.02} />
              </LinearGradient>
            </Defs>
            {areas.map((area) => (
              <Polygon key={area.slice(0, 24)} points={area} fill="url(#enerjiAlan)" />
            ))}
            <Line
              x1={0}
              y1={PADDING_TOP + plotHeight}
              x2={width}
              y2={PADDING_TOP + plotHeight}
              stroke={t.line}
              strokeWidth={1}
            />
            {points.map((point, index) =>
              point.value === null ? null : (
                <Circle
                  key={point.date}
                  cx={x(index)}
                  cy={y(point.value)}
                  r={2.2}
                  fill={t.soft}
                  opacity={0.5}
                />
              ),
            )}
            {runs.map((run) => (
              <Polyline
                key={run.slice(0, 24)}
                points={run}
                fill="none"
                stroke={violet}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </Svg>
        ) : null}
      </View>
    </View>
  )
}
