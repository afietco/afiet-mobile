import { FOOD_CATEGORIES, SEED_FOODS, turkishLower, type SeedFood } from '@afiet/core'
import { router } from 'expo-router'
import { memo, useCallback, useMemo, useState } from 'react'
import { Pressable, ScrollView, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FoodDetailSheet } from '@/features/nutrition/FoodDetailSheet'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'
import { IconBook, IconChevronRight } from '@/ui/icons'

/** Tek besin satırı. memo: rehber ~1000 satır olduğundan aramada yazarken
 *  yalnız props'u değişen satırlar yeniden çizilir. `food` referansı SEED_FOODS
 *  sabitinden gelir (filtreleme referansı korur) → memo güvenle eşleşir. */
const FoodRow = memo(function FoodRow({
  food,
  divider,
  faint,
  onSelect,
}: {
  food: SeedFood
  divider: boolean
  faint: string
  onSelect: (food: SeedFood) => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onSelect(food)}
      className={`w-full flex-row items-center justify-between gap-2 px-4 py-3 active:bg-muted ${
        divider ? 'border-t border-line/40' : ''
      }`}
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

/** Besin rehberi — web FoodsPage.tsx portu */
export default function BesinlerScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SeedFood | null>(null)
  // Kararlı referans: memo'lu FoodRow'un onSelect prop'u her render'da değişmesin.
  const onSelect = useCallback((f: SeedFood) => setSelected(f), [])

  const sections = useMemo(() => {
    const q = turkishLower(query.trim())
    const filtered = q ? SEED_FOODS.filter((f) => turkishLower(f.name).includes(q)) : SEED_FOODS
    return FOOD_CATEGORIES.map((c) => ({
      ...c,
      foods: filtered.filter((f) => f.category === c.key),
    })).filter((c) => c.foods.length > 0)
  }, [query])

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <View className="mb-4 flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
            onPress={() => router.back()}
            className="-ml-2 h-9 w-9 items-center justify-center rounded-full"
          >
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <IconChevronRight size={20} color={t.faint} />
            </View>
          </Pressable>
          <View>
            <View className="flex-row items-center gap-2">
              <IconBook size={26} color={isDark ? '#34d399' : '#059669'} />
              <AppText weight="extrabold" className="text-2xl text-ink">
                Besin Rehberi
              </AppText>
            </View>
            <AppText className="text-sm text-soft">Listedeki besinler ve yaklaşık değerleri</AppText>
          </View>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Besin ara…"
          placeholderTextColor={t.faint}
          className="mb-4 w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink"
          style={{ fontFamily: 'Nunito_400Regular', fontSize: 16 }}
        />

        {sections.length === 0 && (
          <AppText className="py-8 text-center text-sm text-faint">
            Aramanla eşleşen besin yok.
          </AppText>
        )}

        <View className="gap-4">
          {sections.map((c) => (
            <View key={c.key}>
              <AppText weight="bold" className="mb-2 px-1 text-sm text-soft">
                {c.label}
              </AppText>
              <View className="overflow-hidden rounded-2xl bg-surface">
                {c.foods.map((f, i) => (
                  <FoodRow
                    key={f.name}
                    food={f}
                    divider={i > 0}
                    faint={t.faint}
                    onSelect={onSelect}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <FoodDetailSheet food={selected} onClose={() => setSelected(null)} />
    </View>
  )
}
