/**
 * Veri erişim katmanı — UI yalnızca bu arayüzleri kullanır. Arayüzler
 * @afiet/core'da yaşar; bu dosya mobilin expo-sqlite implementasyonunu takar
 * (afiet-web reposundaki src/data/repositories/index.ts'in birebir karşılığı).
 */
export type {
  ProfileRepository,
  MealRepository,
  WaterRepository,
  FoodRepository,
  MeasurementRepository,
} from '@afiet/core'

// Online/kişi-başı: backend (API) implementasyonu takılı. Yerel sqlite
// implementasyonu ./sqlite'da duruyor (referans/olası offline için).
export { profileRepo, mealRepo, waterRepo, foodRepo, measurementRepo } from '../api/repositories'
