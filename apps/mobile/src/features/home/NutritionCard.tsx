import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { mealRepo } from '../../data/repositories'
import { useLiveValue } from '../../data/useLive'
import { useSummary } from '../../data/useSummary'
import { MacroRings } from '../nutrition/MacroRings'
import { AppText } from '@/ui/AppText'
import { IconBowl, IconPlus } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'

/** Dashboard nutrition hero; detailed Afiyet rhythm belongs to Nutrition. */
export function NutritionCard({
  profileId,
  date,
  onAdd,
}: {
  profileId: number
  date: string
  onAdd: () => void
}) {
  // Energy and macro values come from the backend summary.
  const summary = useSummary(date)
  const mealCount = summary ? summary.nutrition.knownCount + summary.nutrition.unknownCount : 0
  // Avoid flashing the first-log prompt before persisted meal dates resolve.
  const loggedDates = useLiveValue(['meals'], () => mealRepo.loggedDates(profileId), [profileId])
  const neverLogged = loggedDates !== undefined && loggedDates.length === 0
  // Render the gradient with measured pixels so it tracks dynamic card height.
  const [size, setSize] = useState({ w: 0, h: 0 })
  const openNutrition = () => router.push('/beslenme')

  return (
    <View
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout
        if (width !== size.w || height !== size.h) setSize({ w: width, h: height })
      }}
      className="relative overflow-hidden rounded-2xl bg-emerald-800 p-4"
    >
      {size.w > 0 && (
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="nutri" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#064e3b" />
              <Stop offset="0.55" stopColor="#065f46" />
              <Stop offset="1" stopColor="#115e59" />
            </LinearGradient>
          </Defs>
          <Rect width={size.w} height={size.h} fill="url(#nutri)" />
        </Svg>
      )}
      {/* A dark depth accent keeps nearby white labels above AA contrast. */}
      <View
        pointerEvents="none"
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-black/10"
      />

      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Beslenme detayını aç"
          onPress={openNutrition}
          className="min-h-11 flex-1 flex-row items-center gap-2.5"
        >
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <IconBowl size={22} color="#ffffff" />
          </View>
          <AppText weight="bold" className="text-white">
            Beslenme
          </AppText>
        </Pressable>
        <View className="flex-row items-center gap-2">
          {mealCount > 0 && (
            <View className="rounded-full bg-white/20 px-2.5 py-0.5">
              <AppText weight="bold" className="text-xs text-white">
                Denge pusulan
              </AppText>
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Besin ekle"
            onPress={onAdd}
            className="h-9 w-9 items-center justify-center rounded-full bg-white"
          >
            <IconPlus size={18} color="#059669" strokeWidth={2.4} />
          </Pressable>
        </View>
      </View>
      {neverLogged ? (
        <View className="rounded-xl border border-white/25 bg-white/10 p-4">
          {/* The dark mascot tone remains legible on the emerald surface. */}
          <AfiPose pose="kasik" size={72} tone="dark" />
          <AppText weight="extrabold" className="mt-1 text-white">
            İlk öğününü ekle 🍽️
          </AppText>
          <AppText className="mt-0.5 text-sm text-emerald-50/90">
            Enerji ve makro pusulan ilk kayıtla işlemeye başlar — gram saymak yok, denge var.
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={onAdd}
            className="mt-3 self-start rounded-xl bg-white px-4 py-2"
          >
            <AppText weight="semibold" className="text-sm text-emerald-700">
              Besin Ekle
            </AppText>
          </Pressable>
        </View>
      ) : (
        summary && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Beslenme detayını aç"
            onPress={openNutrition}
          >
            <MacroRings nutrition={summary.nutrition} targets={summary.targets} hero />
          </Pressable>
        )
      )}
    </View>
  )
}
