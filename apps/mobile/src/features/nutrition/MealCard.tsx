import { mealMeta, measureMeta, type MealEntry, type MealType } from '@afiet/core'
import { Pressable, View } from 'react-native'
import { mealRepo } from '../../data/repositories'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon, MealIcon } from '@/ui/appIcons'
import { IconPlus, IconX } from '@/ui/icons'

interface MealCardProps {
  meal: MealType
  entries: MealEntry[]
  onAdd: () => void
}

const numQty = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })

/** "2 dilim" gibi miktar etiketi — varsayılan tek ölçüde gösterilmez */
function qtyLabel(e: MealEntry): string | null {
  if (!e.quantity || e.quantity === 1) return null
  return `${numQty.format(e.quantity)} ${e.measure ? measureMeta(e.measure).label : 'porsiyon'}`
}

/** Öğün kartı — web MealCard.tsx portu */
export function MealCard({ meal, entries, onAdd }: MealCardProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const meta = mealMeta(meal)

  return (
    <View className="rounded-2xl bg-surface p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <MealIcon meal={meal} size={22} />
          <AppText weight="bold" className="text-ink">
            {meta.label}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onAdd}
          className="flex-row items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5"
        >
          <IconPlus size={16} color="#ffffff" strokeWidth={2.4} />
          <AppText weight="semibold" className="text-sm text-white">
            Ekle
          </AppText>
        </Pressable>
      </View>
      {entries.length === 0 ? (
        <AppText className="text-sm text-faint">Henüz kayıt yok</AppText>
      ) : (
        <View>
          {entries.map((e, i) => (
            <View
              key={e.id}
              className={`flex-row items-center justify-between gap-2 py-2 ${
                i > 0 ? 'border-t border-line/40' : ''
              }`}
            >
              <View className="min-w-0 flex-1 flex-row items-center gap-2">
                <AppText weight="semibold" numberOfLines={1} className="shrink text-ink">
                  {e.foodName}
                </AppText>
                {qtyLabel(e) && (
                  <AppText className="shrink-0 text-xs text-faint">{qtyLabel(e)}</AppText>
                )}
                {e.groups.length > 0 && (
                  <View className="shrink-0 flex-row items-center gap-1">
                    {e.groups.map((g) => (
                      <GroupIcon key={g} group={g} size={16} />
                    ))}
                  </View>
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${e.foodName} kaydını sil`}
                onPress={() => void mealRepo.remove(e.id!)}
                className="shrink-0 rounded-full px-2 py-1"
              >
                <IconX size={16} color={t.faint} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
