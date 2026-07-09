export type MealType = 'kahvalti' | 'ogle' | 'aksam' | 'ara'

export type FoodGroup =
  | 'sebze'
  | 'meyve'
  | 'protein'
  | 'tahil'
  | 'sut'
  | 'yag'
  | 'tatli'
  | 'fastfood'

export type PortionSize = 'kucuk' | 'orta' | 'buyuk'

export type Sex = 'kadin' | 'erkek'

export type ActivityLevel = 'hareketsiz' | 'az' | 'orta' | 'aktif' | 'cok_aktif'

export interface Profile {
  id?: number
  name: string
  emoji: string
  createdAt: string
  // Vücudum — isteğe bağlı; profil oluştururken sorulmaz,
  // Vücudum ekranı ilk açıldığında kurulum sheet'i ile istenir
  sex?: Sex
  /** YYYY-MM-DD */
  birthDate?: string
  heightCm?: number
  activityLevel?: ActivityLevel
}

/** Vücut ölçümü — günde bir kayıt (aynı güne yeni giriş üzerine yazar) */
export interface Measurement {
  id?: number
  profileId: number
  /** YYYY-MM-DD */
  date: string
  weightKg: number
  waistCm?: number
  neckCm?: number
  hipCm?: number
  createdAt: string
}

export interface MealEntry {
  id?: number
  profileId: number
  /** YYYY-MM-DD */
  date: string
  meal: MealType
  foodName: string
  portionSize: PortionSize
  quantity: number
  groups: FoodGroup[]
  note?: string
  createdAt: string
}

export interface WaterLog {
  id?: number
  profileId: number
  /** YYYY-MM-DD */
  date: string
  glasses: number
}

/** Kullanıcının girdiği, seed listesinde olmayan besinler — autocomplete öğrenir */
export interface CustomFood {
  id?: number
  name: string
  groups: FoodGroup[]
}

export const MEAL_TYPES: { key: MealType; label: string }[] = [
  { key: 'kahvalti', label: 'Kahvaltı' },
  { key: 'ogle', label: 'Öğle' },
  { key: 'aksam', label: 'Akşam' },
  { key: 'ara', label: 'Ara Öğün' },
]

// İkonlar ve renkler: src/ui/appIcons.tsx (GroupIcon / MealIcon)
export const FOOD_GROUPS: { key: FoodGroup; label: string; core: boolean }[] = [
  { key: 'sebze', label: 'Sebze', core: true },
  { key: 'meyve', label: 'Meyve', core: true },
  { key: 'protein', label: 'Protein', core: true },
  { key: 'tahil', label: 'Tahıl', core: true },
  { key: 'sut', label: 'Süt Ürünü', core: true },
  { key: 'yag', label: 'Sağlıklı Yağ', core: false },
  { key: 'tatli', label: 'Tatlı/Şekerli', core: false },
  { key: 'fastfood', label: 'Fast Food', core: false },
]

/** Denge özetinde sayılan 5 temel besin grubu */
export const CORE_GROUPS = FOOD_GROUPS.filter((g) => g.core).map((g) => g.key)

export const PORTION_SIZES: { key: PortionSize; label: string }[] = [
  { key: 'kucuk', label: 'Küçük' },
  { key: 'orta', label: 'Orta' },
  { key: 'buyuk', label: 'Büyük' },
]

export const WATER_TARGET_GLASSES = 8

export const SEXES: { key: Sex; label: string }[] = [
  { key: 'kadin', label: 'Kadın' },
  { key: 'erkek', label: 'Erkek' },
]

export const ACTIVITY_LEVELS: {
  key: ActivityLevel
  label: string
  description: string
  multiplier: number
}[] = [
  { key: 'hareketsiz', label: 'Masa başı', description: 'Günün çoğu oturarak geçiyor', multiplier: 1.2 },
  { key: 'az', label: 'Az hareketli', description: 'Haftada 1–3 gün hafif egzersiz', multiplier: 1.375 },
  { key: 'orta', label: 'Orta', description: 'Haftada 3–5 gün egzersiz', multiplier: 1.55 },
  { key: 'aktif', label: 'Aktif', description: 'Haftada 6–7 gün egzersiz', multiplier: 1.725 },
  { key: 'cok_aktif', label: 'Çok aktif', description: 'Fiziksel iş ya da günde çift antrenman', multiplier: 1.9 },
]

export function activityMeta(key: ActivityLevel) {
  return ACTIVITY_LEVELS.find((a) => a.key === key)!
}

export function groupMeta(key: FoodGroup) {
  return FOOD_GROUPS.find((g) => g.key === key)!
}

export function mealMeta(key: MealType) {
  return MEAL_TYPES.find((m) => m.key === key)!
}
