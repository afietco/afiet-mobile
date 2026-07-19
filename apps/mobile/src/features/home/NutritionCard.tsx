import type { Profile } from '@afiet/core'
import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { mealRepo } from '../../data/repositories'
import { useLive } from '../../data/useLive'
import { useSummary } from '../../data/useSummary'
import { MacroRings } from '../nutrition/MacroRings'
import { RhythmStrip } from '@/features/sofra/RhythmStrip'
import { useRhythmWeek } from '@/features/sofra/useRhythmWeek'
import { AppText } from '@/ui/AppText'
import { IconBowl, IconPlus } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

/** Dashboard Beslenme kartı — SAYFANIN RENKLİ KAHRAMANI (degrade eskiden
    karşılama başlığındaydı; odak beslenmeye taşındı). Makro halkaları +
    afiyet ritmi şeridi degrade zeminde beyaz tonlarla yaşar. */
export function NutritionCard({
  profileId,
  profile,
  date,
  onAdd,
}: {
  profileId: number
  profile?: Profile
  date: string
  onAdd: () => void
}) {
  // Enerji + makrolar backend'den (summary) — istemci hesaplamaz.
  const summary = useSummary(date)
  const week = useRhythmWeek(date)
  const kcal = summary?.nutrition.kcal ?? 0
  const mealCount = summary ? summary.nutrition.knownCount + summary.nutrition.unknownCount : 0
  // Hiç kayıt yoksa (yeni kullanıcı) kart ilk görev davetine dönüşür;
  // sorgu dolana kadar davet gösterilmez (mevcut kullanıcıda flash olmasın)
  const loggedDates = useLive(['meals'], () => mealRepo.loggedDates(profileId), [profileId])
  const neverLogged = loggedDates !== undefined && loggedDates.length === 0
  // Kart yüksekliği summary gelince değişir; %100'lü Rect ilk ölçümde takılı
  // kalabiliyor (degrade yarım kalıyordu) — boyutu onLayout ile verip SVG'yi
  // gerçek piksel değerleriyle çiziyoruz.
  const [size, setSize] = useState({ w: 0, h: 0 })

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/beslenme')}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout
        if (width !== size.w || height !== size.h) setSize({ w: width, h: height })
      }}
      className="relative overflow-hidden rounded-2xl bg-emerald-600 p-4"
    >
      {size.w > 0 && (
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="nutri" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#059669" />
              <Stop offset="0.55" stopColor="#10b981" />
              <Stop offset="1" stopColor="#14b8a6" />
            </LinearGradient>
          </Defs>
          <Rect width={size.w} height={size.h} fill="url(#nutri)" />
        </Svg>
      )}
      {/* Dekor: yumuşak ışık lekesi (blur native'de yok) */}
      <View
        pointerEvents="none"
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15"
      />

      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <IconBowl size={22} color="#ffffff" />
          </View>
          <AppText weight="bold" className="text-white">
            Beslenme
          </AppText>
        </View>
        <View className="flex-row items-center gap-2">
          {mealCount > 0 && (
            <View className="rounded-full bg-white/20 px-2.5 py-0.5">
              <AppText weight="bold" className="text-xs text-white">
                {num0.format(Math.round(kcal))} kcal
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
          {/* Emerald zeminde koyu ton: uzun tel beyaza döner, kontur kalkar. */}
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
          <>
            <MacroRings nutrition={summary.nutrition} targets={summary.targets} hero />
            {week ? (
              <RhythmStrip
                week={week.days.map((d) => d.afiyet)}
                todayIndex={week.days.findIndex((d) => d.date === date)}
                hero
              />
            ) : null}
          </>
        )
      )}
    </Pressable>
  )
}
