import { measureMeta, type CustomFood } from '@afiet/core'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { foodRepo } from '@/data/repositories'
import { useLive } from '@/data/useLive'
import { CustomFoodSheet } from '@/features/nutrition/CustomFoodSheet'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'
import { IconBookmark, IconChevronRight, IconPlus } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { PageSkeleton } from '@/ui/PageSkeleton'

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

/** Menüm — kullanıcının kaydettiği besinlerin listesi ve yönetimi */
export default function MenumScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const foodsRaw = useLive(['customFoods'], () => foodRepo.customFoods(), [])
  const foods = foodsRaw ?? []
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<CustomFood | null>(null)

  const sorted = useMemo(
    () => [...foods].sort((a, b) => a.name.localeCompare(b.name, 'tr')),
    [foods],
  )

  const closeSheet = () => {
    setAdding(false)
    setEditing(null)
  }

  // Menü (customFoods) yüklenene dek tüm sayfayı iskeletle geç.
  if (foodsRaw === undefined) return <PageSkeleton />

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
            <AppText className="text-sm text-soft">Kaydettiğin besinler ve değerleri</AppText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setAdding(true)}
          className="mb-4 flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 active:opacity-90"
        >
          <IconPlus size={18} color="#ffffff" strokeWidth={2.4} />
          <AppText weight="semibold" className="text-white">
            Yeni Besin Ekle
          </AppText>
        </Pressable>

        {sorted.length === 0 ? (
          <View className="items-center rounded-2xl bg-surface px-6 py-10">
            <AfiPose pose="kasik" size={104} />
            <AppText weight="bold" className="mt-3 text-ink">
              Menün henüz boş
            </AppText>
            <AppText className="mt-1 text-center text-sm text-soft">
              Yukarıdan ekleyebilir ya da besin eklerken listede olmayan bir besin
              yazınca çıkan düğmeyi kullanabilirsin.
            </AppText>
          </View>
        ) : (
          <View className="overflow-hidden rounded-2xl bg-surface">
            {sorted.map((f, i) => (
              <Pressable
                key={f.id}
                accessibilityRole="button"
                accessibilityLabel={`${f.name} — düzenle`}
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
    </View>
  )
}
