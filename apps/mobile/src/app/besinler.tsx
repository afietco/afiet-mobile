import { FOOD_CATEGORIES, filterSeedFoods, type SeedFood } from '@afiet/core'
import { router } from 'expo-router'
import { memo, useCallback, useMemo, useState } from 'react'
import { FlatList, type ListRenderItemInfo, Pressable, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FoodDetailSheet } from '@/features/nutrition/FoodDetailSheet'
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
      <AppText weight="semibold" numberOfLines={1} className="min-w-0 shrink text-ink">
        {food.name}
      </AppText>
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

const EmptyResults = memo(function EmptyResults() {
  return (
    <View className="items-center py-6">
      <AfiPose pose="merak" size={80} />
      <AppText className="mt-2 text-center text-sm text-faint">Aramanla eşleşen besin yok.</AppText>
    </View>
  )
})

const FoodGuideHeader = memo(function FoodGuideHeader({
  dark,
  faint,
  query,
  topInset,
  onChangeQuery,
}: {
  dark: boolean
  faint: string
  query: string
  topInset: number
  onChangeQuery: (query: string) => void
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
          <AppText className="text-sm text-soft">Listedeki besinler ve yaklaşık değerleri</AppText>
        </View>
      </View>

      <TextInput
        value={query}
        onChangeText={onChangeQuery}
        placeholder="Besin ara…"
        placeholderTextColor={faint}
        className="mb-4 w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink"
        style={{ fontFamily: 'Nunito_400Regular', fontSize: 16 }}
      />
    </>
  )
})

/** Food guide ported from the web FoodsPage. */
export default function BesinlerScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SeedFood | null>(null)
  const onSelect = useCallback((food: SeedFood) => setSelected(food), [])
  const closeDetails = useCallback(() => setSelected(null), [])

  const items = useMemo<FoodListItem[]>(() => {
    const filtered = filterSeedFoods(query)
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
  }, [query])

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
            query={query}
            topInset={insets.top + 16}
            onChangeQuery={setQuery}
          />
        }
        ListEmptyComponent={EmptyResults}
      />

      <FoodDetailSheet food={selected} onClose={closeDetails} />
    </View>
  )
}
