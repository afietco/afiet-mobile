import { MEAL_TYPES, type MealType } from '@afiet/core'
import { memo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useSofrasResult } from '../sofra'
import type { MealStepProps } from './contract'
import { DietProgramsSheet } from './DietProgramsSheet'
import { trackTap } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { MealIcon } from '@/ui/appIcons'
import { IconCalendar, IconChevronRight, IconUtensils } from '@/ui/icons'

/**
 * Step 1: which meal is this.
 *
 * One decision, four answers: the tap IS the answer, and the host carries the
 * flow to the next step the moment it lands. There is no confirm button and the
 * selected state only ever shows when the user walked back here to change their
 * mind.
 *
 * Below the four cards, two things that are not decisions. This step is the
 * shortest in the flow and left the bottom two thirds of an 85% sheet empty,
 * which is a lot of nothing to hand somebody who opened the app to log a meal.
 * What goes there has to be worth the room and must never compete with the four
 * cards for the tap: one card announces work in progress, and the other exists
 * because sofras are a real feature that people (their author included) forget
 * they have. The sofra card only appears when there is no sofra to forget.
 */

/** Two rows of two, so every target is a comfortable thumb-sized card. */
const MEAL_ROWS = [MEAL_TYPES.slice(0, 2), MEAL_TYPES.slice(2)]

export const MealStep = memo(function MealStep({ meal, onMeal, onExitToMenu }: MealStepProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [programsOpen, setProgramsOpen] = useState(false)
  /* Undefined while the query is still in flight. The sofra card waits for a
     real answer rather than flashing "henüz sofran yok" at somebody who has
     five of them. */
  const sofras = useSofrasResult().data
  const showSofraCard = sofras !== undefined && sofras.length === 0

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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Diyet programları, hazırlanıyor. Ayrıntı için dokun"
        onPress={() => {
          trackTap('addfood_diet_programs')
          setProgramsOpen(true)
        }}
        className="mt-1 flex-row items-center gap-3 rounded-2xl border border-line bg-surface p-3 active:opacity-80"
      >
        <View className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <IconCalendar size={20} color={t.soft} />
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <AppText weight="bold" className="text-sm text-ink">
              Diyet programları
            </AppText>
            <View className="rounded-full bg-muted px-2 py-0.5">
              <AppText className="text-[11px] text-soft">hazırlanıyor</AppText>
            </View>
          </View>
          <AppText className="mt-0.5 text-xs leading-relaxed text-soft">
            Sana göre hazırlanmış günlük akışlar yolda.
          </AppText>
        </View>
        <IconChevronRight size={16} color={t.faint} />
      </Pressable>

      {showSofraCard ? (
        <View className="rounded-2xl border border-violet-200 bg-surface p-3 dark:border-violet-900">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
              <IconUtensils size={20} color={isDark ? '#c4b5fd' : '#7c3aed'} />
            </View>
            <View className="min-w-0 flex-1">
              <AppText weight="bold" className="text-sm text-ink">
                Sofranı kur
              </AppText>
              <AppText className="mt-0.5 text-xs leading-relaxed text-soft">
                Aynı kahvaltı çoğu zaman aynı beş şey. Bir kez kur, tek dokunuşla ekle.
              </AppText>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menüm sayfasına git, sofranı kur"
            onPress={() => {
              trackTap('addfood_sofra_cta')
              onExitToMenu()
            }}
            className="mt-3 min-h-11 flex-row items-center justify-center gap-1.5 rounded-xl bg-violet-100 py-2.5 active:opacity-80 dark:bg-violet-900/40"
          >
            <AppText weight="bold" className="text-sm text-violet-800 dark:text-violet-200">
              {"Menüm'e git"}
            </AppText>
            <IconChevronRight size={14} color={isDark ? '#c4b5fd' : '#6d28d9'} />
          </Pressable>
        </View>
      ) : null}

      <DietProgramsSheet open={programsOpen} onClose={() => setProgramsOpen(false)} />
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
