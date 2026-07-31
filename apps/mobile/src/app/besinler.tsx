import {
  FOOD_CATEGORIES,
  FOOD_GROUPS,
  SEED_FOODS,
  measureMeta,
  type SeedFood,
} from '@afiet/core'
import { router } from 'expo-router'
import { memo, useCallback, useMemo, useState } from 'react'
import { FlatList, type ListRenderItemInfo, Pressable, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FoodDetailSheet } from '@/features/nutrition/FoodDetailSheet'
import { FoodGuideFilterBar } from '@/features/nutrition/FoodGuideFilterBar'
import {
  EMPTY_FOOD_FILTER,
  categoryCounts,
  filterFoodGuide,
  groupCounts,
  isFiltering,
  type FoodGuideFilter,
} from '@/features/nutrition/foodGuideFilters'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'
import { IconBook, IconChevronRight } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'

type FoodListItem =
  | {
      key: string
      kind: 'category'
      label: string
      first: boolean
    }
  | {
      key: string
      kind: 'food'
      food: SeedFood
      divider: boolean
      first: boolean
      last: boolean
    }

/** Food references stay stable across searches, so memo only redraws changed visible rows. */
const FoodRow = memo(function FoodRow({
  food,
  divider,
  faint,
  first,
  last,
  onSelect,
}: {
  food: SeedFood
  divider: boolean
  faint: string
  first: boolean
  last: boolean
  onSelect: (food: SeedFood) => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onSelect(food)}
      className={`w-full flex-row items-center justify-between gap-2 bg-surface px-4 py-3 active:bg-muted ${
        divider ? 'border-t border-line/40' : ''
      } ${first ? 'rounded-t-2xl' : ''} ${last ? 'rounded-b-2xl' : ''}`}
    >
      <View className="min-w-0 shrink flex-row items-center gap-2.5">
        <AppText className="text-base">{food.emoji}</AppText>
        <View className="min-w-0 shrink">
          <AppText weight="semibold" numberOfLines={1} className="text-ink">
            {food.name}
          </AppText>
          {/* One metric per row, and it is the portion rather than the energy:
              "1 dilim ≈ 30 g" is the fact people cannot estimate, and a
              calorie number in a browsable list would turn the guide into a
              scoreboard (BRAND.md, voice). */}
          <AppText numberOfLines={1} className="text-xs text-faint">
            1 {measureMeta(food.measure).label} ≈ {food.gramPerMeasure} g
          </AppText>
        </View>
      </View>
      <View className="shrink-0 flex-row items-center gap-1.5">
        {food.groups.map((g) => (
          <GroupIcon key={g} group={g} size={16} />
        ))}
        <IconChevronRight size={16} color={faint} />
      </View>
    </Pressable>
  )
})

const CategoryHeader = memo(function CategoryHeader({
  label,
  first,
}: {
  label: string
  first: boolean
}) {
  return (
    <AppText weight="bold" className={`${first ? '' : 'mt-4'} mb-2 px-1 text-sm text-soft`}>
      {label}
    </AppText>
  )
})

const EmptyResults = memo(function EmptyResults({
  filtering,
  onReset,
}: {
  filtering: boolean
  onReset: () => void
}) {
  return (
    <View className="items-center py-6">
      <AfiPose
        pose="arama"
        size={80}
        intro="giris"
        accessibilityLabel="Afi, aramanı mercekle tarıyor"
      />
      <AppText className="mt-2 text-center text-sm text-faint">
        Bu seçimlerle eşleşen besin yok.
      </AppText>
      {/* Chips can be combined into a corner nothing gets out of, so the way
          back is offered rather than left to be found one chip at a time. */}
      {filtering ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bütün süzgeçleri temizle"
          onPress={onReset}
          className="mt-4 rounded-xl bg-surface px-5 py-2.5 active:opacity-80"
        >
          <AppText weight="semibold" className="text-sm text-soft">
            Süzgeçleri temizle
          </AppText>
        </Pressable>
      ) : null}
    </View>
  )
})

const FoodGuideHeader = memo(function FoodGuideHeader({
  dark,
  faint,
  filter,
  groups,
  categories,
  total,
  topInset,
  onChangeQuery,
  onChangeFilter,
}: {
  dark: boolean
  faint: string
  filter: FoodGuideFilter
  groups: Map<(typeof FOOD_GROUPS)[number]['key'], number>
  categories: Map<(typeof FOOD_CATEGORIES)[number]['key'], number>
  total: number
  topInset: number
  onChangeQuery: (query: string) => void
  onChangeFilter: (filter: FoodGuideFilter) => void
}) {
  return (
    <>
      <View className="mb-4 flex-row items-center gap-2" style={{ marginTop: topInset }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
          onPress={() => router.back()}
          className="-ml-2 h-9 w-9 items-center justify-center rounded-full"
        >
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconChevronRight size={20} color={faint} />
          </View>
        </Pressable>
        <View>
          <View className="flex-row items-center gap-2">
            <IconBook size={26} color={dark ? '#34d399' : '#059669'} />
            <AppText weight="extrabold" className="text-2xl text-ink">
              Besin Rehberi
            </AppText>
          </View>
          {/* The count is the invitation: two thousand is a number worth
              knowing before deciding whether to browse. */}
          <AppText className="text-sm text-soft">
            {total} besin, yaklaşık değerleriyle
          </AppText>
        </View>
      </View>

      <TextInput
        value={filter.query}
        onChangeText={onChangeQuery}
        placeholder="Besin ara…"
        placeholderTextColor={faint}
        className="mb-3 w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink"
        style={{ fontFamily: 'Nunito_400Regular', fontSize: 16 }}
      />

      <FoodGuideFilterBar
        filter={filter}
        onChange={onChangeFilter}
        groups={groups}
        categories={categories}
      />
    </>
  )
})

/** Food guide ported from the web FoodsPage. */
export default function BesinlerScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [filter, setFilter] = useState<FoodGuideFilter>(EMPTY_FOOD_FILTER)
  const [selected, setSelected] = useState<SeedFood | null>(null)
  const onSelect = useCallback((food: SeedFood) => setSelected(food), [])
  const closeDetails = useCallback(() => setSelected(null), [])
  const onChangeQuery = useCallback(
    (query: string) => setFilter((current) => ({ ...current, query })),
    [],
  )

  /* Counted over the text alone, so a group's number never collapses because
     of another chip that is about to be turned off. */
  const groups = useMemo(
    () => groupCounts(filter.query, FOOD_GROUPS.map((group) => group.key)),
    [filter.query],
  )
  const categories = useMemo(
    () => categoryCounts(filter.query, FOOD_CATEGORIES.map((category) => category.key)),
    [filter.query],
  )

  const items = useMemo<FoodListItem[]>(() => {
    const filtered = filterFoodGuide(filter)
    const listItems: FoodListItem[] = []

    for (const category of FOOD_CATEGORIES) {
      const foods = filtered.filter((food) => food.category === category.key)
      if (foods.length === 0) continue

      listItems.push({
        key: `category:${category.key}`,
        kind: 'category',
        label: category.label,
        first: listItems.length === 0,
      })
      foods.forEach((food, index) => {
        listItems.push({
          key: `food:${category.key}:${food.name}`,
          kind: 'food',
          food,
          divider: index > 0,
          first: index === 0,
          last: index === foods.length - 1,
        })
      })
    }

    return listItems
  }, [filter])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FoodListItem>) => {
      if (item.kind === 'category') return <CategoryHeader label={item.label} first={item.first} />

      return (
        <FoodRow
          food={item.food}
          divider={item.divider}
          faint={t.faint}
          first={item.first}
          last={item.last}
          onSelect={onSelect}
        />
      )
    },
    [onSelect, t.faint],
  )

  const keyExtractor = useCallback((item: FoodListItem) => item.key, [])

  return (
    <View className="flex-1 bg-canvas">
      <FlatList
        className="flex-1"
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={16}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={40}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
        ListHeaderComponent={
          <FoodGuideHeader
            dark={isDark}
            faint={t.faint}
            filter={filter}
            groups={groups}
            categories={categories}
            total={SEED_FOODS.length}
            topInset={insets.top + 16}
            onChangeQuery={onChangeQuery}
            onChangeFilter={setFilter}
          />
        }
        ListEmptyComponent={
          <EmptyResults
            filtering={isFiltering(filter)}
            onReset={() => setFilter(EMPTY_FOOD_FILTER)}
          />
        }
      />

      <FoodDetailSheet food={selected} onClose={closeDetails} />
    </View>
  )
}
