import { router, type Href } from 'expo-router'
import { Pressable, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconCheck, IconChevronRight, IconPlus } from '@/ui/icons'

/**
 * "Afi seni %60 tanıyor": how personal the measures already are.
 *
 * This is an invitation, never a score. It says what Afi already knows before
 * it says what is still missing, every missing line is a door that opens
 * somewhere, and no line ever implies the person fell short.
 *
 * Movement-data permission is deliberately absent. It does not exist in the
 * beta, so listing it would leave everyone short of 100 with an invitation
 * nobody can accept. When it arrives it belongs in a separate "even better"
 * card rather than in these weights, otherwise people who reached 100 would
 * wake up at 80.
 */

type AcquaintanceKey = 'temel' | 'kilo' | 'mezura' | 'kayit'

interface AcquaintanceStep {
  key: AcquaintanceKey
  /** Share of the meter. The four shares total 100. */
  weight: number
  /** Read when Afi already has it. */
  done: string
  /** Read when it is still an open door. */
  invite: string
  /** Where the invitation leads. */
  href: Href
}

const STEPS: readonly AcquaintanceStep[] = [
  {
    key: 'temel',
    weight: 40,
    done: 'Boy, yaş ve hareket düzeyin',
    invite: 'Boy, yaş ve hareket düzeyini ekle',
    href: '/vucudum',
  },
  {
    key: 'kilo',
    weight: 20,
    done: 'İlk kilo ölçümün',
    invite: 'İlk kilo ölçünü ekle',
    href: '/vucudum',
  },
  {
    key: 'mezura',
    weight: 25,
    done: 'Mezura ölçün',
    invite: 'Mezura ölçünü ekle',
    href: '/vucudum',
  },
  {
    key: 'kayit',
    weight: 15,
    done: '2 haftalık kayıt',
    invite: 'Sofranı kaydetmeye devam et',
    href: '/(tabs)',
  },
]

export interface AcquaintanceFacts {
  /** Sex, birth date, height and daily movement level are all on the profile. */
  basics: boolean
  /** At least one weight entry exists. */
  firstWeight: boolean
  /** A measurement carries the girths the body-fat estimate needs. */
  tapeMeasure: boolean
  /** Two weeks of steady logging are behind the person. */
  twoWeeksLogged: boolean
}

/** Which facts Afi already holds, in the listed order. */
function has(facts: AcquaintanceFacts, key: AcquaintanceKey): boolean {
  if (key === 'temel') return facts.basics
  if (key === 'kilo') return facts.firstWeight
  if (key === 'mezura') return facts.tapeMeasure
  return facts.twoWeeksLogged
}

export function AcquaintanceMeter({ facts }: { facts: AcquaintanceFacts }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const violet = isDark ? '#a78bfa' : '#7c3aed'
  const emerald = isDark ? '#34d399' : '#059669'

  const percent = STEPS.reduce((total, step) => (has(facts, step.key) ? total + step.weight : total), 0)
  const complete = percent === 100

  return (
    <View className="rounded-2xl bg-surface p-4">
      <AppText weight="bold" className="text-ink">
        Afi seni %{percent} tanıyor
      </AppText>

      {/* The track carries the accessibility node, not the fill: at 0% the fill
          has no width and a screen reader would skip straight past it. */}
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Tanışma göstergesi yüzde ${percent}`}
        accessibilityValue={{ min: 0, max: 100, now: percent }}
        className="mt-2.5 h-2 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950"
      >
        <View className="h-full rounded-full bg-violet-500" style={{ width: `${percent}%` }} />
      </View>

      <AppText className="mt-2 text-xs text-soft">
        {complete
          ? 'Şimdilik bilmem gereken her şey elimde 💛'
          : 'Ne kadar tanışırsak ölçüler o kadar sana benziyor.'}
      </AppText>

      <View className="mt-3 gap-1">
        {STEPS.map((step) =>
          has(facts, step.key) ? (
            <View key={step.key} className="flex-row items-center gap-2.5 py-1.5">
              <IconCheck size={16} color={emerald} strokeWidth={2.6} />
              <AppText className="flex-1 text-sm text-soft">{step.done}</AppText>
            </View>
          ) : (
            <Pressable
              key={step.key}
              accessibilityRole="button"
              accessibilityLabel={step.invite}
              onPress={() => router.push(step.href)}
              className="flex-row items-center gap-2.5 rounded-xl bg-violet-50 px-3 py-2.5 dark:bg-violet-950/50"
            >
              <IconPlus size={16} color={violet} strokeWidth={2.6} />
              <AppText
                weight="semibold"
                className="flex-1 text-sm text-violet-800 dark:text-violet-200"
              >
                {step.invite}
              </AppText>
              <IconChevronRight size={16} color={t.faint} />
            </Pressable>
          ),
        )}
      </View>
    </View>
  )
}
