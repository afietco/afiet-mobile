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

export interface Profile {
  id?: number
  name: string
  emoji: string
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

export const MEAL_TYPES: { key: MealType; label: string; emoji: string }[] = [
  { key: 'kahvalti', label: 'Kahvaltı', emoji: '🌅' },
  { key: 'ogle', label: 'Öğle', emoji: '☀️' },
  { key: 'aksam', label: 'Akşam', emoji: '🌙' },
  { key: 'ara', label: 'Ara Öğün', emoji: '🍎' },
]

export const FOOD_GROUPS: { key: FoodGroup; label: string; emoji: string; core: boolean }[] = [
  { key: 'sebze', label: 'Sebze', emoji: '🥦', core: true },
  { key: 'meyve', label: 'Meyve', emoji: '🍎', core: true },
  { key: 'protein', label: 'Protein', emoji: '🍗', core: true },
  { key: 'tahil', label: 'Tahıl', emoji: '🌾', core: true },
  { key: 'sut', label: 'Süt Ürünü', emoji: '🥛', core: true },
  { key: 'yag', label: 'Sağlıklı Yağ', emoji: '🫒', core: false },
  { key: 'tatli', label: 'Tatlı/Şekerli', emoji: '🍰', core: false },
  { key: 'fastfood', label: 'Fast Food', emoji: '🍔', core: false },
]

/** Denge özetinde sayılan 5 temel besin grubu */
export const CORE_GROUPS = FOOD_GROUPS.filter((g) => g.core).map((g) => g.key)

export const PORTION_SIZES: { key: PortionSize; label: string }[] = [
  { key: 'kucuk', label: 'Küçük' },
  { key: 'orta', label: 'Orta' },
  { key: 'buyuk', label: 'Büyük' },
]

export const WATER_TARGET_GLASSES = 8

export function groupMeta(key: FoodGroup) {
  return FOOD_GROUPS.find((g) => g.key === key)!
}

export function mealMeta(key: MealType) {
  return MEAL_TYPES.find((m) => m.key === key)!
}
