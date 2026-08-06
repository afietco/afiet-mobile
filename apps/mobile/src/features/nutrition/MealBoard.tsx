import { MEAL_TYPES, type MealEntry, type MealType } from '@afiet/core'
import { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { trackTap } from '@/lib/track'
import { AppText } from '@/ui/AppText'
import { MealIcon } from '@/ui/appIcons'
import { IconPlus } from '@/ui/icons'

/**
 * Compact meal row for the nutrition tab.
 *
 * The header keeps the single entry point into the add flow ("Besin Ekle").
 * Under it each meal is one short chip that OPENS that meal instead of adding
 * to it; icon and label share a single line and the entry count rides along as
 * a floating numeral, so the card is about half the height of the old stacked
 * three-line tiles (roughly 92pt instead of 180pt).
 *
 * Both controls are visually shorter than 44pt and win the accessible touch
 * height back through hitSlop.
 */

/** The chip row is tight on small phones, so "Ara Öğün" travels as "Ara". */
const CHIP_LABEL: Partial<Record<MealType, string>> = { ara: 'Ara' }

/** Visual chip height in points; hitSlop lifts the touch target back to 44. */
const CHIP_HEIGHT = 36
const CHIP_HIT_SLOP = { top: 4, bottom: 4, left: 0, right: 0 }

/** The 28pt header pill needs the same treatment. */
const PILL_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 }

/**
 * Counts the entries of every meal in a single pass. The board rerenders on
 * each meal change, so four filters per render would walk the day four times.
 */
function countByMeal(entries: MealEntry[]): Record<MealType, number> {
  const counts = {} as Record<MealType, number>
  for (const meal of MEAL_TYPES) counts[meal.key] = 0
  for (const entry of entries) {
    // An unrecognised meal key (a record written against a newer server enum)
    // must not invent a column here.
    if (counts[entry.meal] !== undefined) counts[entry.meal] += 1
  }
  return counts
}

export function MealBoard({
  entries,
  onOpenMeal,
  onAddFood,
}: {
  entries: MealEntry[]
  onOpenMeal: (meal: MealType) => void
  onAddFood: () => void
}) {
  const counts = useMemo(() => countByMeal(entries), [entries])

  return (
    <View className="rounded-2xl bg-surface px-4 py-2.5">
      <View className="mb-2 h-7 flex-row items-center justify-between">
        <AppText weight="bold" className="text-ink">
          Öğünler
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Besin ekle"
          hitSlop={PILL_HIT_SLOP}
          onPress={() => {
            trackTap('add_food_open', { from: 'meal_board' })
            onAddFood()
          }}
          className="h-7 flex-row items-center gap-1 rounded-full bg-emerald-600 px-3 active:opacity-90"
        >
          <IconPlus size={14} color="#ffffff" strokeWidth={2.8} />
          <AppText weight="semibold" className="text-xs text-white">
            Besin Ekle
          </AppText>
        </Pressable>
      </View>

      <View className="flex-row gap-1.5">
        {MEAL_TYPES.map((m) => {
          const count = counts[m.key] ?? 0
          const filled = count > 0
          return (
            <Pressable
              key={m.key}
              accessibilityRole="button"
              accessibilityLabel={`${m.label}, ${filled ? `${count} besin` : 'şimdilik boş'}`}
              accessibilityHint="Öğünü açar"
              hitSlop={CHIP_HIT_SLOP}
              onPress={() => onOpenMeal(m.key)}
              style={{ height: CHIP_HEIGHT }}
              className={`flex-1 flex-row items-center justify-center gap-1 rounded-xl px-1.5 active:opacity-70 ${
                filled ? 'bg-emerald-50 dark:bg-emerald-950/60' : 'bg-canvas'
              }`}
            >
              <MealIcon meal={m.key} size={16} />
              <AppText
                weight="semibold"
                numberOfLines={1}
                className={`min-w-0 shrink text-[11px] ${filled ? 'text-ink' : 'text-soft'}`}
              >
                {CHIP_LABEL[m.key] ?? m.label}
              </AppText>
              {filled ? (
                // Floating so the numeral costs the label no width.
                <View
                  className="absolute -right-1 -top-1 items-center justify-center rounded-full border-2 border-surface bg-emerald-600 px-1"
                  style={{ minWidth: 18, height: 18 }}
                >
                  <AppText weight="extrabold" className="text-[10px] text-white">
                    {count}
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
