import type { Profile } from '@afiet/core'
import { dayMacros } from '@afiet/core'
import { router } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { mealRepo } from '../../data/repositories'
import { useLive } from '../../data/useLive'
import { useTdee } from '../body/useTdee'
import { MacroRings } from '../nutrition/MacroRings'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { CardHeader } from '@/ui/CardHeader'
import { IconBowl, IconPlus } from '@/ui/icons'

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

/** Dashboard Beslenme kartı — web NutritionCard.tsx portu */
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
  const { isDark } = useTheme()
  const entries = useLive(['meals'], () => mealRepo.forDay(profileId, date), [profileId, date]) ?? []
  const tdeeValue = useTdee(profileId, profile)
  const kcal = dayMacros(entries).kcal
  // Hiç kayıt yoksa (yeni kullanıcı) kart ilk görev davetine dönüşür;
  // sorgu dolana kadar davet gösterilmez (mevcut kullanıcıda flash olmasın)
  const loggedDates = useLive(['meals'], () => mealRepo.loggedDates(profileId), [profileId])
  const neverLogged = loggedDates !== undefined && loggedDates.length === 0

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/beslenme')}
      className="rounded-2xl bg-surface p-4"
    >
      <CardHeader
        icon={<IconBowl size={22} color={isDark ? '#34d399' : '#059669'} />}
        iconBg="bg-emerald-100 dark:bg-emerald-900/50"
        title="Beslenme"
        chevron
        meta={
          <>
            {entries.length > 0 && (
              <View className="rounded-full bg-violet-100 px-2.5 py-0.5 dark:bg-violet-900/50">
                <AppText weight="bold" className="text-xs text-violet-700 dark:text-violet-300">
                  {num0.format(Math.round(kcal))} kcal
                </AppText>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Besin ekle"
              onPress={onAdd}
              className="h-9 w-9 items-center justify-center rounded-full bg-emerald-600"
            >
              <IconPlus size={18} color="#ffffff" strokeWidth={2.4} />
            </Pressable>
          </>
        }
      />
      {neverLogged ? (
        <View className="relative overflow-hidden rounded-xl p-4">
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="invite" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#10b981" />
                <Stop offset="1" stopColor="#14b8a6" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#invite)" />
          </Svg>
          <View
            pointerEvents="none"
            className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15"
          />
          <AppText weight="extrabold" className="text-white">
            İlk öğününü ekle 🍽️
          </AppText>
          <AppText className="mt-0.5 text-sm text-emerald-50/90">
            Enerji ve makro pusulan ilk kayıtla işlemeye başlar — gram saymak yok, denge var.
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={onAdd}
            className="mt-3 self-start rounded-xl border border-white/30 bg-white/20 px-4 py-2"
          >
            <AppText weight="semibold" className="text-sm text-white">
              Besin Ekle
            </AppText>
          </Pressable>
        </View>
      ) : (
        <MacroRings entries={entries} tdeeValue={tdeeValue} />
      )}
    </Pressable>
  )
}
