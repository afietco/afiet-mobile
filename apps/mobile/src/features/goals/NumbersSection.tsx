import { turkishUpper, type GoalRange, type GoalsResult, type Profile } from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { NumbersPanel } from '@/features/body/NumbersPanel'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight } from '@/ui/icons'

/**
 * "Sayılarla": the grams and the kcal, one tap away.
 *
 * They are never hidden and never denied, but they are not the language of this
 * screen either. Collapsed by default is the whole point: someone who wants the
 * numbers finds them immediately, and someone who does not is never handed a
 * calorie target they did not ask for.
 *
 * The section carries two layers. The goal target on top comes from the engine
 * and is the numeric face of the hand measures above; under it sits the body
 * data panel that the /veri screen also hosts.
 */

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

/**
 * Display rounding only, never a calculation: the engine owns the values, and
 * a coarse step keeps a plus or minus fifteen percent estimate from being read
 * as a precise instruction. Both ends land on the same step, so a narrow range
 * collapses into a single number instead of printing "1.850-1.850".
 */
function formatRange(range: GoalRange, step: number): string {
  const min = Math.round(range.min / step) * step
  const max = Math.round(range.max / step) * step
  return min === max ? num0.format(min) : `${num0.format(min)}-${num0.format(max)}`
}

const MACROS: { name: string; key: 'protein' | 'carb' | 'fat'; box: string; title: string; value: string }[] = [
  {
    name: 'Protein',
    key: 'protein',
    box: 'bg-orange-50 dark:bg-orange-950/40',
    title: 'text-orange-600 dark:text-orange-300',
    value: 'text-orange-800 dark:text-orange-100',
  },
  {
    name: 'Karbonhidrat',
    key: 'carb',
    box: 'bg-amber-50 dark:bg-amber-950/40',
    title: 'text-amber-600 dark:text-amber-300',
    value: 'text-amber-800 dark:text-amber-100',
  },
  {
    name: 'Yağ',
    key: 'fat',
    box: 'bg-lime-50 dark:bg-lime-950/40',
    title: 'text-lime-600 dark:text-lime-300',
    value: 'text-lime-800 dark:text-lime-100',
  },
]

export interface NumbersSectionProps {
  profile: Profile | null
  goals: GoalsResult
}

export function NumbersSection({ profile, goals }: NumbersSectionProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [open, setOpen] = useState(false)

  // While no direction has been chosen the engine asks for the numeric target
  // to stay quiet: that user is held in balance language, not given a figure
  // they never opted into. The body data panel below is unaffected.
  const target = goals.numericTargetsMuted ? null : goals.target
  const macros = goals.numericTargetsMuted ? null : goals.macros

  return (
    <View className="gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? 'Sayılarla bölümünü kapat' : 'Sayılarla bölümünü aç'}
        onPress={() => {
          void Haptics.selectionAsync()
          setOpen((current) => !current)
        }}
        className="flex-row items-center gap-2 rounded-2xl bg-surface px-4 py-3.5"
      >
        <View className="flex-1">
          <AppText weight="bold" className="text-ink">
            Sayılarla
          </AppText>
          {open ? null : (
            <AppText className="mt-0.5 text-xs text-faint">
              Gram ve kalori merak edersen burada
            </AppText>
          )}
        </View>
        <View style={{ transform: [{ rotate: open ? '270deg' : '90deg' }] }}>
          <IconChevronRight size={18} color={t.faint} />
        </View>
      </Pressable>

      {open ? (
        <Animated.View entering={FadeIn.duration(180)} className="gap-3">
          {target && macros ? (
            <View className="rounded-2xl bg-surface p-4">
              <AppText weight="bold" className="mb-2 text-ink">
                Günün ölçüsü, sayıyla
              </AppText>
              <View className="rounded-2xl bg-violet-100 p-4 dark:bg-violet-900/40">
                <AppText
                  weight="bold"
                  className="text-[9px] uppercase text-violet-600 dark:text-violet-300"
                >
                  Enerji
                </AppText>
                <AppText
                  weight="extrabold"
                  className="mt-1 text-2xl text-violet-800 dark:text-violet-100"
                >
                  {formatRange(target.range, 10)}
                  <AppText
                    weight="semibold"
                    className="text-sm text-violet-600 dark:text-violet-300"
                  >
                    {' '}
                    kcal
                  </AppText>
                </AppText>
              </View>
              <View className="mt-2 flex-row gap-2">
                {MACROS.map((macro) => (
                  <View key={macro.key} className={`flex-1 rounded-2xl p-3 ${macro.box}`}>
                    <AppText weight="bold" className={`text-[9px] ${macro.title}`}>
                      {turkishUpper(macro.name)}
                    </AppText>
                    <AppText weight="extrabold" className={`mt-1 text-base ${macro.value}`}>
                      {formatRange(macros[macro.key], 5)}
                      <AppText weight="semibold" className={`text-xs ${macro.value}`}>
                        {' '}
                        g
                      </AppText>
                    </AppText>
                  </View>
                ))}
              </View>
              <AppText className="mt-2.5 text-xs text-faint">
                Bunlar hedef değil pusula; günün toplamı buraya yakın durursa yeter.
              </AppText>
            </View>
          ) : null}

          <NumbersPanel profile={profile} />
        </Animated.View>
      ) : null}
    </View>
  )
}
