import type { ApiSummary } from '@/data/api/client'
import { Link } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { useGoals } from '@/features/goals/useGoals'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconFlame } from '@/ui/icons'
import { hasProgressTarget, progressPercent } from './macroProgress'
import { macroTargetsState, type MacroTargetsState } from './macroTargets'

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

/** Light and dark bar fills matching the web macro palette. */
const MACRO_BARS: { key: 'protein' | 'carb' | 'fat'; label: string; fill: [string, string] }[] = [
  { key: 'protein', label: 'Protein', fill: ['#fb923c', '#f97316'] },
  { key: 'carb', label: 'Karbonhidrat', fill: ['#fbbf24', '#f59e0b'] },
  { key: 'fat', label: 'Yağ', fill: ['#84cc16', '#65a30d'] },
]

/** Under 18 the engine gives no target at all, only balance language (doc 9). */
const MINOR_BALANCE =
  'Şimdilik sana sayısal bir ölçü kurmuyorum. Sofrandaki denge yeter: her öğünde bir sebze, bir protein, bir tahıl 🌱'

/** The engine withheld the target because it is missing something real. */
const MISSING_INPUTS =
  "Ölçünü sana göre kurabilmem için seni biraz daha tanımam gerek. Vücudum'a birkaç bilgi eklersen burası dolacak 🌱"

const TARGETS_ERROR = 'Ölçünü şu an getiremedim.'

function Bar({ value, max, fill, tall = false }: { value: number; max: number; fill: string; tall?: boolean }) {
  const pct = progressPercent(value, max)
  return (
    <View className={`overflow-hidden rounded-full bg-muted ${tall ? 'h-3' : 'h-2'}`}>
      <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: fill }} />
    </View>
  )
}

/** The sentence under the bars on the days there is genuinely no target. */
function TargetNote({
  state,
  failed,
  onRetry,
}: {
  state: MacroTargetsState
  failed: boolean
  onRetry: () => void
}) {
  if (failed) {
    return (
      <View className="mt-3 flex-row items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 dark:bg-violet-950/50">
        <AppText className="flex-1 text-xs text-violet-700 dark:text-violet-300">
          {TARGETS_ERROR}
        </AppText>
        <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8}>
          <AppText weight="semibold" className="text-xs text-violet-700 underline dark:text-violet-300">
            Tekrar dene
          </AppText>
        </Pressable>
      </View>
    )
  }

  /* Loading needs no sentence. It lasts a moment, the eaten amounts are already
     on screen, and an apology that appears and leaves again would be the
     loudest thing on the page. */
  if (state.kind === 'ready' || state.kind === 'loading') return null

  return (
    <View className="mt-3 rounded-xl bg-violet-50 px-3 py-2 dark:bg-violet-950/50">
      <AppText className="text-xs leading-5 text-violet-700 dark:text-violet-300">
        {state.kind === 'minor' ? MINOR_BALANCE : null}
        {state.kind === 'incomplete' ? (
          <>
            {MISSING_INPUTS}{' '}
            <Link href="/vucudum">
              <AppText weight="semibold" className="text-xs text-violet-700 underline dark:text-violet-300">
                Vücudum
              </AppText>
            </Link>
          </>
        ) : null}
      </AppText>
    </View>
  )
}

/**
 * Approximate daily energy and macro compass with non-judgmental capped bars.
 *
 * What was eaten is the record (`summary.nutrition`). What it is measured
 * against is the goal engine, never the target the backend still sends beside
 * it: that one is a percentage split of an estimated TDEE, while protein
 * actually scales off lean mass (docs/hedeflerim.md section 1).
 *
 * The target is there for anyone the engine can compute for, which is anyone
 * with a sex, an age, a height and a weight. A direction is not required: the
 * silent `duzen` default gives balanced ranges, and printing them beats leaving
 * the card waiting on a question the person already skipped.
 *
 * Targets print as ranges, and the energy target never prints at all: it only
 * scales the bar. A calorie number set beside what someone ate turns a compass
 * into a verdict, which the brand does not do (BRAND.md, voice).
 *
 * The engine runs inside `useGoals`, which memoizes it. This screen re-renders
 * on every meal notification, so nothing here may recompute a target, and the
 * acquaintance facts are deliberately not asked for: they cost a `['meals']`
 * subscription on the screen where meals are logged.
 */
export function MacroProgressCard({ summary }: { summary: ApiSummary }) {
  const { isDark } = useTheme()
  const { goals, loading, error, retry } = useGoals({ today: summary.date })

  /* A half loaded engine is treated as no engine: the direction arrives from
     storage a beat after the profile does, and targets that shift under the
     reader once it lands would cost more than the extra moment. */
  const settled = loading ? null : goals
  const state = useMemo(() => macroTargetsState(settled), [settled])
  const failed = settled == null && error != null

  const totals = summary.nutrition
  const targets = state.kind === 'ready' ? state.targets : null

  return (
    <View className="rounded-2xl bg-surface p-4">
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
      <Bar value={totals.kcal} max={targets?.energy.mid ?? 0} fill="#8b5cf6" tall />

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
                {/* Without a target the eaten amount still stands on its own.
                    What is missing is the scale behind it, not the record. */}
                <AppText className="text-xs text-faint">
                  <AppText weight="semibold" className="text-xs text-ink">
                    {num0.format(Math.round(totals[m.key]))}
                  </AppText>
                  {targetAvailable ? ` / ${macro.text} g` : ' g'}
                </AppText>
              </View>
              <Bar value={totals[m.key]} max={macro?.mid ?? 0} fill={m.fill[isDark ? 1 : 0]} />
            </View>
          )
        })}
      </View>

      <TargetNote state={state} failed={failed} onRetry={retry} />

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
