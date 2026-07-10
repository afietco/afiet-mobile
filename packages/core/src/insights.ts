import { CORE_GROUPS, type FoodGroup, type MealEntry } from './types'
import { addDays, todayISO } from './dates'

export interface DayBalance {
  covered: FoodGroup[]
  missing: FoodGroup[]
  /** 0..5 — kapsanan temel grup sayısı */
  score: number
  sweetCount: number
  fastfoodCount: number
}

export function dayBalance(entries: MealEntry[]): DayBalance {
  const groups = new Set(entries.flatMap((e) => e.groups))
  const covered = CORE_GROUPS.filter((g) => groups.has(g))
  const missing = CORE_GROUPS.filter((g) => !groups.has(g))
  return {
    covered,
    missing,
    score: covered.length,
    sweetCount: entries.filter((e) => e.groups.includes('tatli')).length,
    fastfoodCount: entries.filter((e) => e.groups.includes('fastfood')).length,
  }
}

/** Yargılamayan, bilgilendirici günlük mikro mesaj */
export function dayMessage(balance: DayBalance, entryCount: number): string {
  if (entryCount === 0) return 'Bugün henüz kayıt yok. İlk öğünü ekleyerek başla! ✨'
  if (balance.score === 5) return 'Harika! Bugün 5 temel besin grubunun hepsinden beslendin. 🌟'
  if (balance.score === 4) return 'Çok iyi gidiyorsun — tabağın neredeyse tamamen dengeli. 💪'
  if (balance.score === 3) return 'İyi bir çeşitlilik var. Eksik grupları da tamamlarsan süper olur.'
  if (balance.sweetCount + balance.fastfoodCount >= 2)
    return 'Bugün tatlı/fast food ağırlıklı geçmiş. Yarın tabağa biraz renk katmayı dene. 🥗'
  return 'Güzel başlangıç! Farklı besin gruplarını denemeye ne dersin?'
}

/**
 * Streak: bugünden (bugün kayıt yoksa dünden) geriye doğru
 * kesintisiz kayıt tutulan gün sayısı.
 */
export function calcStreak(loggedDates: string[]): number {
  const dates = new Set(loggedDates)
  const today = todayISO()
  let cursor = dates.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (dates.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}
