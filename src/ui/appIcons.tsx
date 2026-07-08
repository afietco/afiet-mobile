import type { FC } from 'react'
import type { FoodGroup, MealType } from '../data/types'
import {
  IconApple,
  IconBroccoli,
  IconBurger,
  IconCupcake,
  IconEgg,
  IconMilk,
  IconMoon,
  IconOlive,
  IconStrawberry,
  IconSun,
  IconSunrise,
  IconWheat,
  type IconProps,
} from './icons'

/**
 * Besin grubu ve öğün ikonları + renkleri tek yerde.
 * Renkler Tailwind text-* sınıflarıdır; ikonlar currentColor kullandığı
 * için ileride dark mode'da yalnızca bu sınıflara dark: varyantı eklenir.
 */

export const GROUP_ICON: Record<FoodGroup, FC<IconProps>> = {
  sebze: IconBroccoli,
  meyve: IconStrawberry,
  protein: IconEgg,
  tahil: IconWheat,
  sut: IconMilk,
  yag: IconOlive,
  tatli: IconCupcake,
  fastfood: IconBurger,
}

export const GROUP_COLOR: Record<FoodGroup, string> = {
  sebze: 'text-green-600',
  meyve: 'text-rose-500',
  protein: 'text-orange-500',
  tahil: 'text-amber-500',
  sut: 'text-sky-500',
  yag: 'text-lime-600',
  tatli: 'text-pink-500',
  fastfood: 'text-red-500',
}

export function GroupIcon({ group, className = '' }: { group: FoodGroup; className?: string }) {
  const Icon = GROUP_ICON[group]
  return <Icon className={`${GROUP_COLOR[group]} ${className}`} />
}

export const MEAL_ICON: Record<MealType, FC<IconProps>> = {
  kahvalti: IconSunrise,
  ogle: IconSun,
  aksam: IconMoon,
  ara: IconApple,
}

export const MEAL_COLOR: Record<MealType, string> = {
  kahvalti: 'text-orange-500',
  ogle: 'text-amber-500',
  aksam: 'text-indigo-500',
  ara: 'text-rose-500',
}

export function MealIcon({ meal, className = '' }: { meal: MealType; className?: string }) {
  const Icon = MEAL_ICON[meal]
  return <Icon className={`${MEAL_COLOR[meal]} ${className}`} />
}
