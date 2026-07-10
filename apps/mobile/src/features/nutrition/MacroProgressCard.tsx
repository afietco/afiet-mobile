import type { MealEntry } from '@afiet/core'
import { FALLBACK_TDEE, dayMacros, macroTargetGrams, type MacroKey } from '@afiet/core'
import { Link } from 'expo-router'
import { View } from 'react-native'
import { useCustomFoods } from './useCustomFoods'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconFlame } from '@/ui/icons'

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

/** [açık, koyu] dolgu hex'leri — web MacroProgressCard.tsx bg-* sınıflarının karşılığı */
const MACRO_BARS: { key: MacroKey; label: string; fill: [string, string] }[] = [
  { key: 'protein', label: 'Protein', fill: ['#fb923c', '#f97316'] },
  { key: 'carb', label: 'Karbonhidrat', fill: ['#fbbf24', '#f59e0b'] },
  { key: 'fat', label: 'Yağ', fill: ['#84cc16', '#65a30d'] },
]

function Bar({ value, max, fill, tall = false }: { value: number; max: number; fill: string; tall?: boolean }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <View className={`overflow-hidden rounded-full bg-muted ${tall ? 'h-3' : 'h-2'}`}>
      <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: fill }} />
    </View>
  )
}

/**
 * Günün yaklaşık enerji ve makro ilerlemesi — web MacroProgressCard.tsx portu.
 * Katı takip değil pusula: bar %100'de durur, ton yargılamaz.
 */
export function MacroProgressCard({
  entries,
  tdeeValue,
}: {
  entries: MealEntry[]
  tdeeValue: number | null
}) {
  const { isDark } = useTheme()
  const customFoods = useCustomFoods()
  const totals = dayMacros(entries, customFoods)
  const target = tdeeValue ?? FALLBACK_TDEE

  return (
    <View className="rounded-2xl bg-surface p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <IconFlame size={20} color={isDark ? '#a78bfa' : '#7c3aed'} />
          <AppText weight="bold" className="text-ink">
            Enerji & Makrolar
          </AppText>
        </View>
        <AppText weight="bold" className="text-sm text-violet-700 dark:text-violet-300">
          {num0.format(Math.round(totals.kcal))}
          <AppText className="text-sm text-faint"> / {num0.format(Math.round(target))} kcal</AppText>
        </AppText>
      </View>
      <Bar value={totals.kcal} max={target} fill="#8b5cf6" tall />

      <View className="mt-3 gap-2.5">
        {MACRO_BARS.map((m) => {
          const targetG = macroTargetGrams(target, m.key)
          return (
            <View key={m.key}>
              <View className="mb-1 flex-row items-center justify-between">
                <AppText weight="semibold" className="text-xs text-soft">
                  {m.label}
                </AppText>
                <AppText className="text-xs text-faint">
                  <AppText weight="semibold" className="text-xs text-ink">
                    {num0.format(Math.round(totals[m.key]))}
                  </AppText>
                  {' / '}
                  {num0.format(Math.round(targetG))} g
                </AppText>
              </View>
              <Bar value={totals[m.key]} max={targetG} fill={m.fill[isDark ? 1 : 0]} />
            </View>
          )
        })}
      </View>

      {tdeeValue == null && (
        <View className="mt-3 rounded-xl bg-violet-50 px-3 py-2 dark:bg-violet-950/50">
          <AppText className="text-xs text-violet-700 dark:text-violet-300">
            Genel bir referansla gösteriliyor.{' '}
            <Link href="/vucudum">
              <AppText weight="semibold" className="text-xs text-violet-700 underline dark:text-violet-300">
                Vücudum
              </AppText>
            </Link>{' '}
            bilgilerini tamamlarsan hedefler sana göre hesaplanır.
          </AppText>
        </View>
      )}
      {totals.unknownCount > 0 && (
        <AppText className="mt-2 text-[11px] text-faint">
          {totals.unknownCount} kaydın makrosu bilinmediği için hesaba katılamadı.
        </AppText>
      )}
      <AppText className="mt-2 text-[11px] text-faint">
        Değerler yaklaşıktır — pusula niyetine, gram gram saymıyoruz. 💛
      </AppText>
    </View>
  )
}
