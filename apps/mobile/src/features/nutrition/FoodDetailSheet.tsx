import { categoryMeta, groupMeta, measureMeta, type SeedFood } from '@afiet/core'
import { View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'
import { Chip } from '@/ui/Chip'
import { Sheet } from '@/ui/Sheet'

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })
const num1 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })

const MACRO_BOXES: {
  key: 'protein' | 'carb' | 'fat'
  label: string
  box: string
  title: string
  value: string
}[] = [
  {
    key: 'protein',
    label: 'Protein',
    box: 'bg-orange-50 dark:bg-orange-950/40',
    title: 'text-orange-600 dark:text-orange-300',
    value: 'text-orange-800 dark:text-orange-100',
  },
  {
    key: 'carb',
    label: 'Karb.',
    box: 'bg-amber-50 dark:bg-amber-950/40',
    title: 'text-amber-600 dark:text-amber-300',
    value: 'text-amber-800 dark:text-amber-100',
  },
  {
    key: 'fat',
    label: 'Yağ',
    box: 'bg-lime-50 dark:bg-lime-950/40',
    title: 'text-lime-600 dark:text-lime-300',
    value: 'text-lime-800 dark:text-lime-100',
  },
]

/** Rehberdeki bir besinin detayı — web FoodDetailSheet.tsx portu */
export function FoodDetailSheet({ food, onClose }: { food: SeedFood | null; onClose: () => void }) {
  return (
    <Sheet
      open={food !== null}
      onClose={onClose}
      title={
        <AppText weight="bold" className="text-lg text-ink">
          {food?.name}
        </AppText>
      }
    >
      {food && (
        <>
          <AppText weight="semibold" className="-mt-1 mb-3 text-xs text-faint">
            {categoryMeta(food.category).label}
          </AppText>

          {food.groups.length > 0 && (
            <View className="mb-4 flex-row flex-wrap gap-2">
              {food.groups.map((g) => (
                <Chip key={g} label={groupMeta(g).label} icon={<GroupIcon group={g} size={18} />} />
              ))}
            </View>
          )}

          <AppText weight="bold" className="mb-2 text-sm text-ink">
            1 {measureMeta(food.measure).label} için yaklaşık değerler
          </AppText>
          <View className="mb-2 flex-row gap-2">
            {MACRO_BOXES.map((m) => (
              <View key={m.key} className={`flex-1 rounded-2xl p-3 ${m.box}`}>
                <AppText weight="bold" className={`text-[10px] uppercase ${m.title}`}>
                  {m.label}
                </AppText>
                <AppText weight="extrabold" className={`mt-1 text-base ${m.value}`}>
                  {num1.format(food.macros[m.key])}
                  <AppText weight="semibold" className={`text-xs ${m.value}`}>
                    {' '}
                    g
                  </AppText>
                </AppText>
              </View>
            ))}
          </View>
          <View className="mb-4 rounded-xl bg-violet-50 px-3.5 py-2.5 dark:bg-violet-950/50">
            <AppText className="text-sm text-violet-800 dark:text-violet-200">
              Enerji:{' '}
              <AppText weight="bold" className="text-sm text-violet-800 dark:text-violet-200">
                {num0.format(food.macros.kcal)} kcal
              </AppText>
            </AppText>
          </View>

          <AppText weight="bold" className="mb-1 text-sm text-ink">
            Nedir?
          </AppText>
          <AppText className="mb-4 text-sm leading-relaxed text-soft">{food.description}</AppText>

          <AppText className="text-xs text-faint">
            Değerler ev porsiyonuna göre yaklaşıktır. 💛
          </AppText>
        </>
      )}
    </Sheet>
  )
}
