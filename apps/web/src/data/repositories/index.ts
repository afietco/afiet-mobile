/**
 * Veri erişim katmanı — UI yalnızca bu arayüzleri kullanır. Arayüzler
 * @afiet/core'da yaşar; bu dosya web'in Dexie implementasyonunu takar.
 * Backend/mobil için farklı implementasyon aynı arayüzlere takılır, UI değişmez.
 */
export type {
  ProfileRepository,
  MealRepository,
  WaterRepository,
  FoodRepository,
  MeasurementRepository,
} from '@afiet/core'

export { profileRepo, mealRepo, waterRepo, foodRepo, measurementRepo } from './dexie'
