/**
 * Which food group shows up at which meal.
 *
 * The one chart here that points at something to do rather than something to
 * know: a whole empty column under "Kahvaltı" for vegetables is a sentence the
 * totals never say out loud. Built from the meal records the app already has,
 * so it needs nothing from the server.
 */
import { CORE_GROUPS, FOOD_GROUPS, MEAL_TYPES, type FoodGroup, type MealEntry, type MealType } from '@afiet/core'
import { View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'

const groupLabel = (group: FoodGroup) =>
  FOOD_GROUPS.find((item) => item.key === group)?.label ?? group

export function GroupMealMatrix({ entries }: { entries: MealEntry[] }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  if (entries.length === 0) return null

  const counts = new Map<string, number>()
  let max = 0
  for (const entry of entries) {
    for (const group of entry.groups) {
      if (!(CORE_GROUPS as FoodGroup[]).includes(group)) continue
      const key = `${group}|${entry.meal}`
      const next = (counts.get(key) ?? 0) + 1
      counts.set(key, next)
      if (next > max) max = next
    }
  }
  if (max === 0) return null

  const cell = (group: FoodGroup, meal: MealType) => counts.get(`${group}|${meal}`) ?? 0

  return (
    <View className="rounded-2xl bg-surface p-5">
      <AppText weight="bold" className="mb-1 text-ink">
        Hangi grup hangi öğünde?
      </AppText>
      <AppText className="mb-4 text-xs leading-5 text-faint">
        Koyu kare, o grubu o öğünde sık yediğini gösterir. Boş bir satır ya da
        sütun eksiklik değil, denemediğin bir yer.
      </AppText>

      <View className="flex-row">
        {/* Row labels sit in their own column so the grid stays square. */}
        <View className="w-24">
          <View className="h-6" />
          {CORE_GROUPS.map((group) => (
            <View key={group} className="h-9 flex-row items-center gap-1.5">
              <GroupIcon group={group} size={14} />
              <AppText className="flex-1 text-[11px] text-soft" numberOfLines={1}>
                {groupLabel(group)}
              </AppText>
            </View>
          ))}
        </View>

        <View className="flex-1">
          <View className="h-6 flex-row gap-1.5">
            {MEAL_TYPES.map((meal) => (
              <AppText
                key={meal.key}
                className="flex-1 text-center text-[10px] text-faint"
                numberOfLines={1}
              >
                {meal.label === 'Ara Öğün' ? 'Ara' : meal.label}
              </AppText>
            ))}
          </View>

          {CORE_GROUPS.map((group) => (
            <View key={group} className="h-9 flex-row items-center gap-1.5">
              {MEAL_TYPES.map((meal) => {
                const count = cell(group, meal.key)
                return (
                  <View
                    key={meal.key}
                    accessibilityLabel={`${groupLabel(group)}, ${meal.label}: ${count} kayıt`}
                    className="h-7 flex-1 items-center justify-center rounded-md"
                    style={{
                      backgroundColor: count > 0 ? '#7c3aed' : 'transparent',
                      opacity: count > 0 ? 0.2 + (count / max) * 0.8 : 1,
                      borderWidth: count > 0 ? 0 : 1,
                      borderColor: t.line,
                    }}
                  />
                )
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
