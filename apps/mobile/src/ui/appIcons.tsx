import type { FoodGroup, MealType } from '@afiet/core'
import type { FC } from 'react'
import { useTheme } from '@/theme/useTheme'
import {
  IconApple,
  IconBean,
  IconBroccoli,
  IconBurger,
  IconCupcake,
  IconDrink,
  IconEgg,
  IconHazelnut,
  IconMilk,
  IconMoon,
  IconOlive,
  IconSimit,
  IconStrawberry,
  IconSun,
  IconSunrise,
  IconWheat,
  type IconProps,
} from './icons'

/**
 * Besin grubu ve öğün ikonları + renkleri tek yerde —
 * afiet-web reposundaki src/ui/appIcons.tsx portu. Web'de renkler text-*
 * sınıfları; native ikonlar color prop'u aldığından [açık, koyu] hex çifti
 * tutulur. `color` verilirse tema rengi ezilir (ör. aktif chip'te beyaz).
 */

export const GROUP_ICON: Record<FoodGroup, FC<IconProps>> = {
  sebze: IconBroccoli,
  meyve: IconStrawberry,
  protein: IconEgg,
  tahil: IconWheat,
  sut: IconMilk,
  bakliyat: IconBean,
  yag: IconOlive,
  kuruyemis: IconHazelnut,
  hamurisi: IconSimit,
  icecek: IconDrink,
  tatli: IconCupcake,
  fastfood: IconBurger,
}

const GROUP_COLOR: Record<FoodGroup, [string, string]> = {
  sebze: ['#16a34a', '#4ade80'], // green-600 / green-400
  meyve: ['#f43f5e', '#fb7185'], // rose-500 / rose-400
  protein: ['#f97316', '#fb923c'], // orange-500 / orange-400
  tahil: ['#f59e0b', '#fbbf24'], // amber-500 / amber-400
  sut: ['#0ea5e9', '#38bdf8'], // sky-500 / sky-400
  bakliyat: ['#0d9488', '#2dd4bf'], // teal-600 / teal-400
  yag: ['#65a30d', '#a3e635'], // lime-600 / lime-400
  kuruyemis: ['#b45309', '#d97706'], // amber-700 / amber-600
  hamurisi: ['#7c3aed', '#a78bfa'], // violet-600 / violet-400
  icecek: ['#0891b2', '#22d3ee'], // cyan-600 / cyan-400
  tatli: ['#ec4899', '#f472b6'], // pink-500 / pink-400
  fastfood: ['#ef4444', '#f87171'], // red-500 / red-400
}

export function GroupIcon({
  group,
  size = 24,
  color,
}: {
  group: FoodGroup
  size?: number
  color?: string
}) {
  const { isDark } = useTheme()
  const Icon = GROUP_ICON[group]
  return <Icon size={size} color={color ?? GROUP_COLOR[group][isDark ? 1 : 0]} />
}

export const MEAL_ICON: Record<MealType, FC<IconProps>> = {
  kahvalti: IconSunrise,
  ogle: IconSun,
  aksam: IconMoon,
  ara: IconApple,
}

const MEAL_COLOR: Record<MealType, [string, string]> = {
  kahvalti: ['#f97316', '#fb923c'], // orange-500 / orange-400
  ogle: ['#f59e0b', '#fbbf24'], // amber-500 / amber-400
  aksam: ['#6366f1', '#818cf8'], // indigo-500 / indigo-400
  ara: ['#f43f5e', '#fb7185'], // rose-500 / rose-400
}

export function MealIcon({
  meal,
  size = 24,
  color,
}: {
  meal: MealType
  size?: number
  color?: string
}) {
  const { isDark } = useTheme()
  const Icon = MEAL_ICON[meal]
  return <Icon size={size} color={color ?? MEAL_COLOR[meal][isDark ? 1 : 0]} />
}
