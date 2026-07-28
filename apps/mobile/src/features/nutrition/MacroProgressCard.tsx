import type { ApiSummary } from '@/data/api/client'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconFlame } from '@/ui/icons'
import { hasProgressTarget, progressPercent } from './macroProgress'
import type { MeasureTargets } from './measureViewTargets'

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

/** Light and dark bar fills matching the web macro palette. */
const MACRO_BARS: { key: 'protein' | 'carb' | 'fat'; label: string; fill: [string, string] }[] = [
  { key: 'protein', label: 'Protein', fill: ['#fb923c', '#f97316'] },
  { key: 'carb', label: 'Karbonhidrat', fill: ['#fbbf24', '#f59e0b'] },
  { key: 'fat', label: 'Yağ', fill: ['#84cc16', '#65a30d'] },
]

function Bar({ value, max, fill, tall = false }: { value: number; max: number; fill: string; tall?: boolean }) {
  const pct = progressPercent(value, max)
  return (
    <View className={`overflow-hidden rounded-full bg-muted ${tall ? 'h-3' : 'h-2'}`}>
      <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: fill }} />
    </View>
  )
}

export interface MacroProgressCardProps {
  summary: ApiSummary
  /**
   * The day's target, from the goal engine (`measureViewTargets`). Null when
   * the engine has no target to give, and then the bars carry what was eaten
   * with no scale behind them rather than a borrowed number.
   */
  targets: MeasureTargets | null
  /** Why a target is missing, worded by the card that hosts this body. */
  note?: ReactNode
}

/**
 * "Sayılarla": the same day's measure, in grams and calories.
 *
 * What was eaten is the record (`summary.nutrition`). What it is measured
 * against is the goal engine, never the target the backend still sends beside
 * it: that one is a percentage split of an estimated TDEE and would disagree
 * with the hand measures under the same toggle (docs/hedeflerim.md section 1).
 *
 * Targets print as ranges, and the energy target never prints at all: it only
 * scales the bar. A calorie number set beside what someone ate turns a compass
 * into a verdict, which the brand does not do (BRAND.md, voice).
 */
export function MacroProgressCard({ summary, targets, note }: MacroProgressCardProps) {
  const { isDark } = useTheme()
  const totals = summary.nutrition
  const target = targets?.energy.mid ?? 0

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <IconFlame size={20} color={isDark ? '#a78bfa' : '#7c3aed'} />
          <AppText weight="bold" className="text-ink">
            Enerji ve Makro Dengesi
          </AppText>
        </View>
        <AppText weight="bold" className="text-sm text-violet-700 dark:text-violet-300">
          Yaklaşık {num0.format(Math.round(totals.kcal))} kcal
        </AppText>
      </View>
      <Bar value={totals.kcal} max={target} fill="#8b5cf6" tall />
      {!hasProgressTarget(target) ? (
        <AppText className="mt-1.5 text-xs text-faint">Enerji referansı hazırlanıyor.</AppText>
      ) : null}

      <View className="mt-3 gap-2.5">
        {MACRO_BARS.map((m) => {
          const macro = targets?.[m.key] ?? null
          const targetAvailable = macro != null && hasProgressTarget(macro.mid)
          return (
            <View key={m.key}>
              <View className="mb-1 flex-row items-center justify-between">
                <AppText weight="semibold" className="text-xs text-soft">
                  {m.label}
                </AppText>
                <AppText className="text-xs text-faint">
                  {targetAvailable ? (
                    <>
                      <AppText weight="semibold" className="text-xs text-ink">
                        {num0.format(Math.round(totals[m.key]))}
                      </AppText>
                      {' / '}
                      {macro.text} g
                    </>
                  ) : (
                    'Referans hazırlanıyor'
                  )}
                </AppText>
              </View>
              <Bar value={totals[m.key]} max={macro?.mid ?? 0} fill={m.fill[isDark ? 1 : 0]} />
            </View>
          )
        })}
      </View>

      {/* Rendered as given, spacing included: the note is often nothing, and an
          empty wrapper would still leave a gap under the bars. */}
      {note}

      {totals.unknownCount > 0 && (
        <AppText className="mt-2 text-[11px] text-faint">
          {totals.unknownCount} kaydın makrosu bilinmediği için hesaba katılamadı.
        </AppText>
      )}
      <AppText className="mt-2 text-[11px] text-faint">
        Değerler yaklaşıktır; pusula niyetine, gram gram saymıyoruz. 💛
      </AppText>
    </View>
  )
}
