import {
  categoryMeta,
  dietTagMeta,
  groupMeta,
  mealMeta,
  measureMeta,
  type SeedFood,
} from '@afiet/core'
import { View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { GroupIcon, MealIcon } from '@/ui/appIcons'
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

/** Tek satırlık "etiket: değer"; kataloğun sayısal metrikleri için. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <AppText className="text-sm text-soft">{label}</AppText>
      <AppText weight="bold" className="text-sm text-ink">
        {value}
      </AppText>
    </View>
  )
}

/** Rehberdeki bir besinin detayı; web FoodDetailSheet.tsx portu */
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

          {/*
            Everything else the catalogue knows about this food.

            All of it was already stored and none of it was ever shown: the
            sheet stopped at three macros and a sentence, so lif, the real
            weight of a portion, which meals it belongs to, whether it is
            vegan, what it counts towards in water, and the lighter thing to
            reach for instead all sat in the data unread. That is most of what
            makes a catalogue worth browsing rather than only searching.
          */}
          <View className="mb-4 gap-2 rounded-2xl bg-muted p-3">
            <Fact label="Bir ölçü" value={`${num0.format(food.gramPerMeasure)} g`} />
            <Fact label="Lif" value={`${num1.format(food.fiberG)} g`} />
            {food.liquidMl !== undefined ? (
              <Fact label="Sıvı katkısı" value={`${num0.format(food.liquidMl)} ml`} />
            ) : null}
          </View>

          {food.dietTags.length > 0 ? (
            <>
              <AppText weight="bold" className="mb-2 text-sm text-ink">
                Uyumlu olduğu beslenme
              </AppText>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {food.dietTags.map((tag) => (
                  <Chip key={tag} label={dietTagMeta(tag).label} />
                ))}
              </View>
            </>
          ) : null}

          {food.suitableMeals.length > 0 ? (
            <>
              <AppText weight="bold" className="mb-2 text-sm text-ink">
                Genelde ne zaman yenir
              </AppText>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {food.suitableMeals.map((meal) => (
                  <Chip
                    key={meal}
                    label={mealMeta(meal).label}
                    icon={<MealIcon meal={meal} size={18} />}
                  />
                ))}
              </View>
            </>
          ) : null}

          <AppText weight="bold" className="mb-1 text-sm text-ink">
            Nedir?
          </AppText>
          <AppText className="mb-4 text-sm leading-relaxed text-soft">{food.description}</AppText>

          {/* A balance move, never a correction: the food on screen is fine,
              and this is the other thing that would also have been fine. The
              wording carries no "instead of", because there is nothing here
              to make up for (BRAND.md, voice). */}
          {food.lighterAlternative ? (
            <View className="mb-4 flex-row items-start gap-2 rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/50">
              <AppText className="text-base">🌿</AppText>
              <AppText className="min-w-0 flex-1 text-sm leading-relaxed text-emerald-900 dark:text-emerald-100">
                Canın çekerse{' '}
                <AppText
                  weight="bold"
                  className="text-sm text-emerald-900 dark:text-emerald-100"
                >
                  {food.lighterAlternative}
                </AppText>{' '}
                da sofrana yakışır.
              </AppText>
            </View>
          ) : null}

          {food.aliases.length > 0 ? (
            <AppText className="mb-3 text-xs leading-relaxed text-faint">
              Ayrıca şöyle de aranır: {food.aliases.join(', ')}
            </AppText>
          ) : null}

          <AppText className="text-xs text-faint">
            Değerler ev porsiyonuna göre yaklaşıktır. 💛
          </AppText>
        </>
      )}
    </Sheet>
  )
}
