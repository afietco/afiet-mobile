import { MEAL_TYPES, type MealType } from '@afiet/core'
import { memo } from 'react'
import { Pressable, View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { MealIcon } from '@/ui/appIcons'
import type { MealStepProps } from './contract'

/**
 * Step 1: which meal is this.
 *
 * One decision, four answers, nothing else on the screen. There is no confirm
 * button by design: the tap IS the answer, and the host carries the flow to the
 * next step the moment it lands. The selected state only ever shows when the
 * user walked back here to change their mind.
 */

/** Two rows of two, so every target is a comfortable thumb-sized card. */
const MEAL_ROWS = [MEAL_TYPES.slice(0, 2), MEAL_TYPES.slice(2)]

export const MealStep = memo(function MealStep({ meal, onMeal }: MealStepProps) {
  return (
    <View className="gap-3">
      {MEAL_ROWS.map((row) => (
        <View key={row[0].key} className="flex-row gap-3">
          {row.map((item) => (
            <MealCard
              key={item.key}
              mealType={item.key}
              label={item.label}
              selected={meal === item.key}
              onPress={onMeal}
            />
          ))}
        </View>
      ))}
    </View>
  )
})

const MealCard = memo(function MealCard({
  mealType,
  label,
  selected,
  onPress,
}: {
  mealType: MealType
  label: string
  selected: boolean
  onPress: (meal: MealType) => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} öğününe ekle`}
      onPress={() => onPress(mealType)}
      className={`flex-1 items-center gap-2 rounded-2xl border py-7 active:opacity-80 ${
        selected
          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60'
          : 'border-line bg-surface'
      }`}
    >
      <MealIcon meal={mealType} size={34} />
      <AppText weight="bold" className="text-base text-ink">
        {label}
      </AppText>
    </Pressable>
  )
})
