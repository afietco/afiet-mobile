/**
 * Veri erişim katmanı — UI yalnızca bu arayüzleri kullanır. Arayüzler
 * @afiet/core'da yaşar; bu dosya mobilin expo-sqlite implementasyonunu takar
 * (web'deki apps/web/src/data/repositories/index.ts'in birebir karşılığı).
 */
export type {
  ProfileRepository,
  MealRepository,
  WaterRepository,
  FoodRepository,
  MeasurementRepository,
} from '@afiet/core'

export { profileRepo, mealRepo, waterRepo, foodRepo, measurementRepo } from './sqlite'
