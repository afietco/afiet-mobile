import { MEAL_TYPES, mealMeta, type MealEntry, type MealType } from '@afiet/core'
import { Pressable, View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { MealIcon } from '@/ui/appIcons'
import { IconPlus } from '@/ui/icons'

/**
 * Öğünler; tek satırda dört öğün (Kahvaltı · Öğle · Akşam · Ara). Eski 2×2
 * öğün ızgarasının yerine geçer: üstte tek dokunuşla "Besin Ekle", altta her
 * öğün için doğrudan ekleme hücresi. Dolu öğünde sayaç rozeti, boşta artı.
 */
export function MealBoard({
  entries,
  onAddMeal,
  onQuickAdd,
}: {
  entries: MealEntry[]
  onAddMeal: (meal: MealType) => void
  onQuickAdd: () => void
}) {
  return (
    <View className="rounded-2xl bg-surface p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <AppText weight="bold" className="text-ink">
          Öğünler
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Besin ekle"
          onPress={onQuickAdd}
          className="flex-row items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 active:opacity-90"
        >
          <IconPlus size={16} color="#ffffff" strokeWidth={2.6} />
          <AppText weight="semibold" className="text-sm text-white">
            Besin Ekle
          </AppText>
        </Pressable>
      </View>

      <View className="flex-row gap-2">
        {MEAL_TYPES.map((m) => {
          const count = entries.filter((e) => e.meal === m.key).length
          return (
            <Pressable
              key={m.key}
              accessibilityRole="button"
              accessibilityLabel={`${mealMeta(m.key).label} öğününe besin ekle${
                count > 0 ? `, ${count} besin` : ''
              }`}
              onPress={() => onAddMeal(m.key)}
              className="flex-1 items-center rounded-2xl bg-canvas py-3 active:opacity-80"
            >
              <View className="relative">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-muted">
                  <MealIcon meal={m.key} size={22} />
                </View>
                {count > 0 ? (
                  <View
                    className="absolute -right-1 -top-1 items-center justify-center rounded-full border border-surface bg-emerald-600 px-1"
                    style={{ minWidth: 20, height: 20 }}
                  >
                    <AppText weight="extrabold" className="text-[10px] text-white">
                      {count}
                    </AppText>
                  </View>
                ) : (
                  <View
                    className="absolute -right-1 -top-1 items-center justify-center rounded-full border border-surface bg-emerald-600"
                    style={{ width: 20, height: 20 }}
                  >
                    <IconPlus size={11} color="#ffffff" strokeWidth={3} />
                  </View>
                )}
              </View>
              <AppText weight="semibold" numberOfLines={1} className="mt-1.5 text-xs text-ink">
                {mealMeta(m.key).label}
              </AppText>
              <AppText className="text-[10px] text-faint">
                {count > 0 ? `${count} besin` : 'ekle'}
              </AppText>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
