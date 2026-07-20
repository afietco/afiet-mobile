import { turkishLower } from '@afiet/core'
import type { AfiPhotoFood } from './afiPhoto'

const foodKey = (name: string) => turkishLower(name.trim())

/** Checks whether a food was already accepted or rejected in this session. */
export function isHandledFood(
  name: string,
  logged: ReadonlySet<string>,
  rejected: ReadonlySet<string>,
): boolean {
  const key = foodKey(name)
  return logged.has(key) || rejected.has(key)
}

/** Removes only the confirmed food from the latest queue snapshot. */
export function removeConfirmedFood(
  current: AfiPhotoFood[],
  confirmedName: string,
): AfiPhotoFood[] {
  const index = current.findIndex((food) => foodKey(food.name) === foodKey(confirmedName))
  if (index < 0) return current
  return [...current.slice(0, index), ...current.slice(index + 1)]
}
