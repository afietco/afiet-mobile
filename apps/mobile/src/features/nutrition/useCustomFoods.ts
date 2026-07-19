import type { CustomFood } from '@afiet/core'
import { foodRepo } from '../../data/repositories'
import { useLiveValue } from '../../data/useLive'

/** Kullanıcının menüsü (customFoods) — tablo değiştikçe canlı güncellenir */
export function useCustomFoods(): CustomFood[] {
  return useLiveValue(['customFoods'], () => foodRepo.customFoods(), []) ?? []
}
