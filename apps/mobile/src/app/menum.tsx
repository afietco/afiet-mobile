import { measureMeta, type CustomFood } from '@afiet/core'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { foodRepo } from '@/data/repositories'
import { useLive } from '@/data/useLive'
import { CustomFoodSheet } from '@/features/nutrition/CustomFoodSheet'
import { SofraMacroLine } from '@/features/nutrition/SofraMacroLine'
import { SofraSheet } from '@/features/nutrition/SofraSheet'
import { deleteSofra, sofraSummary, useSofrasResult, type Sofra } from '@/features/nutrition/sofra'
import { StarterMenuCard } from '@/features/nutrition/StarterMenuCard'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon, MealIcon } from '@/ui/appIcons'
import { IconBookmark, IconChevronRight, IconPlus, IconUtensils } from '@/ui/icons'
import { PageSkeleton } from '@/ui/PageSkeleton'

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

/**
 * How much of the saved-food list is shown before it has to be asked for.
 *
 * The list grows for the rest of the account's life and every row is the same
 * height, so past a point the screen is one long column with everything else
 * pushed off the bottom of it. Six rows is enough to recognise the list for
 * what it is; the rest is one tap away and never leaves.
 */
const FOODS_PREVIEW = 6

/**
 * Menüm; the saved foods and the sofras built out of them.
 *
 * Sofralar lead. They were written second because a sofra is assembled from
 * saved foods, but ordering the screen by how the data is built put the short,
 * rarely changing list under a list with no ceiling: with thirty foods saved,
 * "Sofralarım" was somewhere below the fold and nobody scrolled to it. What is
 * read most often goes first, and the foods keep the bottom of the screen where
 * their length costs nothing.
 */
export default function MenumScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const foodsQuery = useLive(['customFoods'], () => foodRepo.customFoods(), [])
  const foodsRaw = foodsQuery.data
  const foods = foodsRaw ?? []
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<CustomFood | null>(null)
  const sofrasQuery = useSofrasResult()
  const sofras = sofrasQuery.data ?? []
  const [sofraOpen, setSofraOpen] = useState(false)
  const [editingSofra, setEditingSofra] = useState<Sofra | null>(null)
  const [allFoods, setAllFoods] = useState(false)

  const sorted = useMemo(
    () => [...foods].sort((a, b) => a.name.localeCompare(b.name, 'tr')),
    [foods],
  )
  const shownFoods = allFoods ? sorted : sorted.slice(0, FOODS_PREVIEW)
  const hiddenFoods = sorted.length - shownFoods.length

  const closeSheet = () => {
    setAdding(false)
    setEditing(null)
  }

  const closeSofra = () => {
    setSofraOpen(false)
    setEditingSofra(null)
  }

  /* Destructive and irreversible, so it is confirmed and it is reached by a
     long press rather than sitting next to the tap that opens the editor. */
  const confirmDeleteSofra = (sofra: Sofra) => {
    Alert.alert(sofra.name, 'Bu sofrayı silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          void deleteSofra(sofra.id).catch(() => {
            Alert.alert('Silinemedi', 'Bağlantını kontrol edip tekrar dener misin?')
          })
        },
      },
    ])
  }

  if (foodsRaw === undefined)
    return <PageSkeleton error={foodsQuery.error} onRetry={foodsQuery.retry} />

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
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
              <IconBookmark size={26} color={isDark ? '#c4b5fd' : '#7c3aed'} />
              <AppText weight="extrabold" className="text-2xl text-ink">
                Menüm
              </AppText>
            </View>
            <AppText className="text-sm text-soft">Sofraların ve kaydettiğin besinler</AppText>
          </View>
        </View>

        {/* Sofralar; kept short by nature, so they open the screen. */}
        <View className="flex-row items-center gap-2">
          <IconUtensils size={22} color={isDark ? '#c4b5fd' : '#7c3aed'} />
          <AppText weight="extrabold" className="flex-1 text-xl text-ink">
            Sofralarım
          </AppText>
        </View>
        <AppText className="mb-3 mt-0.5 text-sm text-soft">
          Birlikte yediklerini bir araya getir, besin eklerken tek dokunuşla gelsin
        </AppText>

        {sofras.length > 0 ? (
          <View className="mb-3 overflow-hidden rounded-2xl bg-surface">
            {sofras.map((sofra, index) => (
              <Pressable
                key={sofra.id}
                accessibilityRole="button"
                accessibilityLabel={`${sofra.name} sofrasını düzenle`}
                accessibilityHint="Silmek için uzun bas"
                onPress={() => {
                  setEditingSofra(sofra)
                  setSofraOpen(true)
                }}
                onLongPress={() => confirmDeleteSofra(sofra)}
                className={`w-full flex-row items-center gap-3 px-4 py-3 active:bg-muted ${
                  index > 0 ? 'border-t border-line/40' : ''
                }`}
              >
                <View className="min-w-0 flex-1">
                  <AppText weight="semibold" numberOfLines={1} className="text-ink">
                    {sofra.name}
                  </AppText>
                  <AppText numberOfLines={1} className="text-xs text-faint">
                    {sofraSummary(sofra)}
                  </AppText>
                  <SofraMacroLine foods={sofra.foods} />
                </View>
                <View className="shrink-0 flex-row items-center gap-1.5">
                  {/* No meals means every meal, and a row of all four icons
                      would say the opposite of the calm that means. */}
                  {sofra.meals.map((meal) => (
                    <MealIcon key={meal} meal={meal} size={16} />
                  ))}
                  {sofra.meals.length === 0 ? (
                    <AppText className="text-xs text-faint">her öğün</AppText>
                  ) : null}
                  <IconChevronRight size={16} color={t.faint} />
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Yeni sofra kur"
          accessibilityState={{ disabled: foods.length === 0 }}
          disabled={foods.length === 0}
          onPress={() => {
            setEditingSofra(null)
            setSofraOpen(true)
          }}
          className={`flex-row items-center justify-center gap-2 rounded-2xl border-2 border-violet-500 py-3 active:opacity-80 dark:border-violet-400 ${
            foods.length === 0 ? 'opacity-40' : ''
          }`}
        >
          <IconPlus size={17} color={isDark ? '#c4b5fd' : '#7c3aed'} strokeWidth={2.4} />
          <AppText weight="semibold" className="text-violet-700 dark:text-violet-300">
            Yeni sofra kur
          </AppText>
        </Pressable>
        {foods.length === 0 ? (
          <AppText className="mt-2 text-center text-xs text-faint">
            Sofra kurmak için önce menünde birkaç besin olmalı.
          </AppText>
        ) : null}

        {/* Kaydettiklerim; the list with no ceiling, so it closes the screen. */}
        <View className="mt-6 flex-row items-center gap-2">
          <IconBookmark size={22} color={isDark ? '#c4b5fd' : '#7c3aed'} />
          <AppText weight="extrabold" className="flex-1 text-xl text-ink">
            Kaydettiklerim
          </AppText>
          {sorted.length > 0 ? (
            <AppText className="text-sm text-faint">{sorted.length} besin</AppText>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setAdding(true)}
          className="mb-3 mt-3 flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 active:opacity-90"
        >
          <IconPlus size={18} color="#ffffff" strokeWidth={2.4} />
          <AppText weight="semibold" className="text-white">
            Yeni Besin Ekle
          </AppText>
        </Pressable>

        {/* An empty menu is where this screen is least useful and most often
            seen, so it gets a way out rather than only an explanation. */}
        {sorted.length === 0 ? (
          <StarterMenuCard />
        ) : (
          <View className="overflow-hidden rounded-2xl bg-surface">
            {shownFoods.map((f, i) => (
              <Pressable
                key={f.id}
                accessibilityRole="button"
                accessibilityLabel={`${f.name} besinini düzenle`}
                onPress={() => setEditing(f)}
                className={`w-full flex-row items-center justify-between gap-2 px-4 py-3 active:bg-muted ${
                  i > 0 ? 'border-t border-line/40' : ''
                }`}
              >
                <View className="min-w-0 shrink">
                  <AppText weight="semibold" numberOfLines={1} className="text-ink">
                    {f.name}
                  </AppText>
                  {f.macros && (
                    <AppText className="text-xs text-faint">
                      ~{num0.format(f.macros.kcal)} kcal /{' '}
                      {measureMeta(f.measure ?? 'porsiyon').label}
                    </AppText>
                  )}
                </View>
                <View className="shrink-0 flex-row items-center gap-1.5">
                  {f.groups.map((g) => (
                    <GroupIcon key={g} group={g} size={16} />
                  ))}
                  <IconChevronRight size={16} color={t.faint} />
                </View>
              </Pressable>
            ))}
            {/* The rest is asked for, and once asked for it stays: collapsing
                it again under someone who is halfway down the list would move
                the ground they are standing on. */}
            {hiddenFoods > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Kalan ${hiddenFoods} besini göster`}
                onPress={() => setAllFoods(true)}
                className="w-full flex-row items-center justify-center gap-1.5 border-t border-line/40 px-4 py-3 active:bg-muted"
              >
                <AppText weight="semibold" className="text-sm text-violet-700 dark:text-violet-300">
                  {hiddenFoods} besin daha göster
                </AppText>
                <View style={{ transform: [{ rotate: '90deg' }] }}>
                  <IconChevronRight size={15} color={isDark ? '#c4b5fd' : '#7c3aed'} />
                </View>
              </Pressable>
            ) : null}
          </View>
        )}

        <AppText className="mt-4 text-xs text-faint">
          Menündeki besinler eklerken önerilerde görünür; makro girdiklerin günlük
          enerji pusulana sayılır. 💛
        </AppText>
      </ScrollView>

      <CustomFoodSheet
        open={adding || editing !== null}
        initial={editing}
        onClose={closeSheet}
      />
      <SofraSheet open={sofraOpen} initial={editingSofra} onClose={closeSofra} />
    </View>
  )
}
