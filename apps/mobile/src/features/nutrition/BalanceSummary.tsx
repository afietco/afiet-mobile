import { FOOD_GROUPS, dayBalance, dayMessage, type MealEntry } from '@afiet/core'
import { View } from 'react-native'
import { balanceRingsLabel } from '@/features/accessibility/chartLabels'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'

/** Denge halkaları (+ isteğe bağlı günlük mesaj) — web BalanceSummary.tsx portu */
export function BalanceRings({ entries, message = true }: { entries: MealEntry[]; message?: boolean }) {
  const balance = dayBalance(entries)
  const coreGroups = FOOD_GROUPS.filter((g) => g.core)
  const coveredLabels = coreGroups
    .filter((group) => balance.covered.includes(group.key))
    .map((group) => group.label)
  const missingLabels = coreGroups
    .filter((group) => balance.missing.includes(group.key))
    .map((group) => group.label)

  return (
    <>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={balanceRingsLabel(coveredLabels, missingLabels)}
        className={`flex-row justify-between gap-1 ${message ? 'mb-3' : ''}`}
      >
        {coreGroups.map((g) => {
          const covered = balance.covered.includes(g.key)
          return (
            <View key={g.key} className="flex-1 items-center gap-1">
              <View
                className={`h-11 w-11 items-center justify-center rounded-full ${
                  covered
                    ? 'border-2 border-emerald-400 bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-900/50'
                    : 'bg-muted opacity-40'
                }`}
              >
                <GroupIcon group={g.key} size={24} />
              </View>
              <AppText
                weight={covered ? 'semibold' : 'normal'}
                className={`text-[10px] ${covered ? 'text-emerald-700 dark:text-emerald-300' : 'text-faint'}`}
              >
                {g.label}
              </AppText>
            </View>
          )
        })}
      </View>
      {message && <AppText className="text-sm text-soft">{dayMessage(balance, entries.length)}</AppText>}
    </>
  )
}

export function BalanceSummary({ entries }: { entries: MealEntry[] }) {
  const balance = dayBalance(entries)

  return (
    <View className="rounded-2xl bg-surface p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <AppText weight="bold" className="text-ink">
          Günlük Denge
        </AppText>
        <View
          className={`rounded-full px-3 py-1 ${
            balance.score >= 4
              ? 'bg-emerald-100 dark:bg-emerald-900/60'
              : balance.score >= 2
                ? 'bg-amber-100 dark:bg-amber-900/50'
                : 'bg-muted'
          }`}
        >
          <AppText
            weight="bold"
            className={`text-sm ${
              balance.score >= 4
                ? 'text-emerald-700 dark:text-emerald-300'
                : balance.score >= 2
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-soft'
            }`}
          >
            {balance.score}/5
          </AppText>
        </View>
      </View>
      <BalanceRings entries={entries} />
    </View>
  )
}
