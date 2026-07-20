import { turkishLower } from '@afiet/core'
import type { AfiPhotoFood } from './afiPhoto'

const foodKey = (name: string) => turkishLower(name.trim())

/** Removes only the confirmed food from the latest queue snapshot. */
export function removeConfirmedFood(
  current: AfiPhotoFood[],
  confirmedName: string,
): AfiPhotoFood[] {
  const index = current.findIndex((food) => foodKey(food.name) === foodKey(confirmedName))
  if (index < 0) return current
  return [...current.slice(0, index), ...current.slice(index + 1)]
}
