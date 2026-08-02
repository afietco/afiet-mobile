import { FOOD_GROUPS, MEAL_TYPES, type FoodGroup } from '@afiet/core'
import { DIET_TAGS, FOOD_CATEGORIES, type FoodCategory } from '@afiet/core/foods'
import type { ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon, MealIcon } from '@/ui/appIcons'
import { Chip } from '@/ui/Chip'
import { toggleFilterValue, type FoodGuideFilter } from './foodGuideFilters'

/**
 * The three questions the guide can now be asked, as three rails of chips.
 *
 * Rails rather than a filter sheet: a sheet hides what is available behind a
 * button, and what is available IS the answer here. Someone who does not know
 * what to look for is exactly who this screen is for, and a row of chips they
 * can read without deciding anything first is the whole invitation.
 *
 * Group counts ride on the group chips because that is the rail where the
 * catalogue's shape is least obvious. Meals and diet tags are small closed
 * sets people can already picture.
 */

interface FoodGuideFilterBarProps {
  filter: FoodGuideFilter
  onChange: (filter: FoodGuideFilter) => void
  groups: Map<FoodGroup, number>
  categories: Map<FoodCategory, number>
}

function Rail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="mb-2.5">
      <AppText weight="bold" className="mb-1.5 px-1 text-xs text-soft">
        {label}
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
      >
        {children}
      </ScrollView>
    </View>
  )
}

export function FoodGuideFilterBar({
  filter,
  onChange,
  groups,
  categories,
}: FoodGuideFilterBarProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']

  return (
    <View className="mb-2">
      <Rail label="Ne zaman">
        {MEAL_TYPES.map((meal) => (
          <Chip
            key={meal.key}
            label={meal.label}
            icon={
              <MealIcon
                meal={meal.key}
                size={16}
                color={filter.meals.includes(meal.key) ? '#ffffff' : undefined}
              />
            }
            active={filter.meals.includes(meal.key)}
            onPress={() => onChange({ ...filter, meals: toggleFilterValue(filter.meals, meal.key) })}
          />
        ))}
      </Rail>

      {/* Asked second, right after when: "çorba" is what a thing IS on the
          table, and it is the word people arrive with. The group rail below
          asks what it is made of, which is a different question a lentil soup
          answers twice. */}
      <Rail label="Tür">
        {FOOD_CATEGORIES.map((category) => {
          const count = categories.get(category.key) ?? 0
          if (count === 0) return null
          const active = filter.categories.includes(category.key)
          return (
            <Chip
              key={category.key}
              label={`${category.label} · ${String(count)}`}
              active={active}
              onPress={() =>
                onChange({
                  ...filter,
                  categories: toggleFilterValue(filter.categories, category.key),
                })
              }
            />
          )
        })}
      </Rail>

      <Rail label="Besin grubu">
        {FOOD_GROUPS.map((group) => {
          const count = groups.get(group.key) ?? 0
          /* A group with nothing behind it is left out rather than shown
             disabled: the rail is a map of what is in there, and an entry
             that leads nowhere makes it a worse map. */
          if (count === 0) return null
          const active = filter.groups.includes(group.key)
          return (
            <Chip
              key={group.key}
              label={`${group.label} · ${String(count)}`}
              icon={<GroupIcon group={group.key} size={16} color={active ? '#ffffff' : undefined} />}
              active={active}
              onPress={() =>
                onChange({ ...filter, groups: toggleFilterValue(filter.groups, group.key) })
              }
            />
          )
        })}
      </Rail>

      <Rail label="Beslenme">
        {DIET_TAGS.map((tag) => (
          <Chip
            key={tag.key}
            label={tag.label}
            active={filter.dietTags.includes(tag.key)}
            onPress={() =>
              onChange({ ...filter, dietTags: toggleFilterValue(filter.dietTags, tag.key) })
            }
          />
        ))}
      </Rail>

      <View className="h-px" style={{ backgroundColor: t.line }} />
    </View>
  )
}
