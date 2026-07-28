/**
 * Veri erişim katmanı; UI yalnızca bu arayüzleri kullanır. Arayüzler
 * @afiet/core'da yaşar; bu dosya mobilin expo-sqlite implementasyonunu takar
 * (afiet-web reposundaki src/data/repositories/index.ts'in birebir karşılığı).
 */
export type {
  ProfileRepository,
  MealRepository,
  WaterRepository,
  FoodRepository,
  MeasurementRepository,
  GoalDirectionRepository,
} from '@afiet/core'

// Online/kişi-başı: backend (API) implementasyonu takılı. Yerel sqlite
// implementasyonu ./sqlite'da duruyor (referans/olası offline için).
export { profileRepo, mealRepo, waterRepo, foodRepo, measurementRepo } from '../api/repositories'

// Goal directions are device local for now: the API has no goal_directions
// endpoint yet. Swapping this one line for an API implementation is the whole
// migration, because the UI only ever sees the interface. The store is
// AsyncStorage rather than ./sqlite so this barrel stays free of ../db, which
// opens the database at module scope.
export { goalDirectionRepo } from './goalDirectionStorage'
