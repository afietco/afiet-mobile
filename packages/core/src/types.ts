export type MealType = 'kahvalti' | 'ogle' | 'aksam' | 'ara'

export type FoodGroup =
  | 'sebze'
  | 'meyve'
  | 'protein'
  | 'tahil'
  | 'bakliyat'
  | 'sut'
  | 'yag'
  | 'kuruyemis'
  | 'hamurisi'
  | 'icecek'
  | 'tatli'
  | 'fastfood'

/** Eski kayıtlarda kalan porsiyon alanı; yeni kayıtlar ölçü+miktar kullanır */
export type PortionSize = 'kucuk' | 'orta' | 'buyuk'

/** Besine uygun miktar ölçüsü; her besin kendi ölçüsüyle sorulur */
export type FoodMeasure =
  | 'adet'
  | 'dilim'
  | 'kase'
  | 'kasik'
  | 'bardak'
  | 'fincan'
  | 'avuc'
  | 'porsiyon'

/**
 * 1 ölçü için yaklaşık makro değerleri (gram; enerji kcal).
 * Bilinç amaçlı yaklaşık değerlerdir, hassas takip hedeflenmez.
 */
export interface Macros {
  kcal: number
  protein: number
  carb: number
  fat: number
}

export type Sex = 'kadin' | 'erkek'

export type ActivityLevel = 'hareketsiz' | 'az' | 'orta' | 'aktif' | 'cok_aktif'

export type SportActivity =
  | 'walking'
  | 'running'
  | 'fitness'
  | 'football'
  | 'basketball'
  | 'swimming'
  | 'cycling'
  | 'pilates_yoga'
  | 'racket_sports'
  | 'combat_sports'
  | 'dance'
  | 'other'

export interface Profile {
  id?: number
  name: string
  emoji: string
  createdAt: string
  // Vücudum; isteğe bağlı; profil oluştururken sorulmaz,
  // Vücudum ekranı ilk açıldığında kurulum sheet'i ile istenir
  sex?: Sex
  /** YYYY-MM-DD */
  birthDate?: string
  heightCm?: number
  activityLevel?: ActivityLevel
  sports?: SportActivity[]
}

/** Vücut ölçümü; günde bir kayıt (aynı güne yeni giriş üzerine yazar) */
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
  /** @deprecated eski kayıtlarda dolu; yeni kayıtlar measure+quantity kullanır */
  portionSize?: PortionSize
  quantity: number
  /** Kaydedilen miktarın ölçüsü (yoksa porsiyon varsayılır) */
  measure?: FoodMeasure
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

/** Kullanıcının girdiği, seed listesinde olmayan besinler; autocomplete öğrenir */
export interface CustomFood {
  id?: number
  name: string
  groups: FoodGroup[]
  /** Kullanıcının bu besin için en son kullandığı ölçü */
  measure?: FoodMeasure
  /** 1 ölçü için kullanıcının girdiği yaklaşık makrolar; girildiyse gün toplamına sayılır */
  macros?: Macros
  /** Kullanıcının besin hakkında kısa notu (Menüm'de gösterilir) */
  description?: string
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
  { key: 'bakliyat', label: 'Bakliyat', core: false },
  { key: 'yag', label: 'Sağlıklı Yağ', core: false },
  { key: 'kuruyemis', label: 'Kuruyemiş', core: false },
  { key: 'hamurisi', label: 'Hamur İşi', core: false },
  { key: 'icecek', label: 'İçecek', core: false },
  { key: 'tatli', label: 'Tatlı/Şekerli', core: false },
  { key: 'fastfood', label: 'Fast Food', core: false },
]

/** Denge özetinde sayılan 5 temel besin grubu */
export const CORE_GROUPS = FOOD_GROUPS.filter((g) => g.core).map((g) => g.key)

export const FOOD_MEASURES: {
  key: FoodMeasure
  /** Miktarla birlikte okunan ad: "2 dilim" */
  label: string
  /** Miktar girişindeki soru başlığı */
  ask: string
}[] = [
  { key: 'adet', label: 'adet', ask: 'Kaç adet?' },
  { key: 'dilim', label: 'dilim', ask: 'Kaç dilim?' },
  { key: 'kase', label: 'kase', ask: 'Kaç kase?' },
  { key: 'kasik', label: 'kaşık', ask: 'Kaç kaşık?' },
  { key: 'bardak', label: 'bardak', ask: 'Kaç bardak?' },
  { key: 'fincan', label: 'fincan', ask: 'Kaç fincan?' },
  { key: 'avuc', label: 'avuç', ask: 'Kaç avuç?' },
  { key: 'porsiyon', label: 'porsiyon', ask: 'Kaç porsiyon?' },
]

export function measureMeta(key: FoodMeasure) {
  return FOOD_MEASURES.find((m) => m.key === key)!
}

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
  { key: 'az', label: 'Hafif hareketli', description: 'Gün içinde ara sıra hareket ediyorum', multiplier: 1.375 },
  { key: 'orta', label: 'Hareketli', description: 'Günün önemli bir bölümünde ayaktayım', multiplier: 1.55 },
  { key: 'aktif', label: 'Çok hareketli', description: 'Gün boyu sık sık hareket ediyorum', multiplier: 1.725 },
  { key: 'cok_aktif', label: 'Fiziksel tempo', description: 'İşim veya günlük rutinim fiziksel olarak yoğun', multiplier: 1.9 },
]

export const SPORT_ACTIVITIES: { key: SportActivity; label: string; emoji: string }[] = [
  { key: 'walking', label: 'Yürüyüş', emoji: '🚶' },
  { key: 'running', label: 'Koşu', emoji: '🏃' },
  { key: 'fitness', label: 'Fitness', emoji: '🏋️' },
  { key: 'football', label: 'Futbol', emoji: '⚽' },
  { key: 'basketball', label: 'Basketbol', emoji: '🏀' },
  { key: 'swimming', label: 'Yüzme', emoji: '🏊' },
  { key: 'cycling', label: 'Bisiklet', emoji: '🚴' },
  { key: 'pilates_yoga', label: 'Pilates / Yoga', emoji: '🧘' },
  { key: 'racket_sports', label: 'Raket sporları', emoji: '🎾' },
  { key: 'combat_sports', label: 'Dövüş sporları', emoji: '🥊' },
  { key: 'dance', label: 'Dans', emoji: '💃' },
  { key: 'other', label: 'Diğer', emoji: '✨' },
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
