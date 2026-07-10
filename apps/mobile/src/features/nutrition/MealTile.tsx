import { mealMeta, type MealEntry, type MealType } from '@afiet/core'
import { Pressable, View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { MealIcon } from '@/ui/appIcons'
import { IconPlus } from '@/ui/icons'

interface MealTileProps {
  meal: MealType
  entries: MealEntry[]
  onPress: () => void
}

const PREVIEW_COUNT = 3

/**
 * Kompakt öğün kutusu — Beslenme'de 2×2 ızgaranın hücresi. Dokununca o
 * öğünün ekleme sheet'i açılır; kayıt silme sheet içindeki çiplerden yapılır.
 */
export function MealTile({ meal, entries, onPress }: MealTileProps) {
  const meta = mealMeta(meal)
  const shown = entries.slice(0, PREVIEW_COUNT)
  const more = entries.length - shown.length

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${meta.label} — besin ekle`}
      onPress={onPress}
      className="w-[48.5%] rounded-2xl bg-surface p-3.5 active:opacity-80"
      style={{ minHeight: 118 }}
    >
      <View className="mb-2 flex-row items-center justify-between">
        <View className="min-w-0 shrink flex-row items-center gap-1.5">
          <MealIcon meal={meal} size={20} />
          <AppText weight="bold" numberOfLines={1} className="shrink text-sm text-ink">
            {meta.label}
          </AppText>
        </View>
        <View className="h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600">
          <IconPlus size={14} color="#ffffff" strokeWidth={2.6} />
        </View>
      </View>
      {entries.length === 0 ? (
        <AppText className="text-xs text-faint">Henüz yok</AppText>
      ) : (
        <View className="gap-1">
          {shown.map((e) => (
            <AppText key={e.id} numberOfLines={1} className="text-xs text-soft">
              {e.foodName}
            </AppText>
          ))}
          {more > 0 && (
            <AppText weight="semibold" className="text-[11px] text-faint">
              +{more} daha
            </AppText>
          )}
        </View>
      )}
    </Pressable>
  )
}
