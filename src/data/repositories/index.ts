/**
 * Veri erişim katmanı — UI yalnızca bu arayüzleri kullanır.
 * İleride backend (PocketBase/Firebase vb.) eklenirse burada yeni bir
 * implementasyon takılır, UI değişmez.
 */
import type {
  CustomFood,
  FoodGroup,
  FoodMeasure,
  Measurement,
  MealEntry,
  Profile,
  WaterLog,
} from '../types'

export interface ProfileRepository {
  all(): Promise<Profile[]>
  get(id: number): Promise<Profile | undefined>
  /** Kayıtlı aktif id geçersizse geri dönüş: cihazdaki ilk profil */
  first(): Promise<Profile | undefined>
  /** Onboarding — profil kimlik + vücut bilgileriyle tek seferde oluşturulur */
  create(attrs: Omit<Profile, 'id' | 'createdAt'>): Promise<number>
  /** Profil ekranından isim/avatar düzenleme */
  updateIdentity(id: number, attrs: Pick<Profile, 'name' | 'emoji'>): Promise<void>
  /** Vücudum kurulumu/düzenlemesi — yalnızca vücut alanlarını günceller */
  updateBody(
    id: number,
    attrs: Pick<Profile, 'sex' | 'birthDate' | 'heightCm' | 'activityLevel'>,
  ): Promise<void>
}

export interface MealRepository {
  forDay(profileId: number, date: string): Promise<MealEntry[]>
  forRange(profileId: number, from: string, to: string): Promise<MealEntry[]>
  add(entry: Omit<MealEntry, 'id'>): Promise<number>
  remove(id: number): Promise<void>
  /** Kayıt tutulan tüm günler (streak hesabı için) */
  loggedDates(profileId: number): Promise<string[]>
}

export interface WaterRepository {
  forDay(profileId: number, date: string): Promise<WaterLog | undefined>
  forRange(profileId: number, from: string, to: string): Promise<WaterLog[]>
  setGlasses(profileId: number, date: string, glasses: number): Promise<void>
}

export interface FoodRepository {
  /** Kullanıcının öğrettiği besinler */
  customFoods(): Promise<CustomFood[]>
  learn(name: string, groups: FoodGroup[], measure?: FoodMeasure): Promise<void>
}

export interface MeasurementRepository {
  /** Profilin tüm ölçümleri, tarihe göre artan */
  forProfile(profileId: number): Promise<Measurement[]>
  forRange(profileId: number, from: string, to: string): Promise<Measurement[]>
  latest(profileId: number): Promise<Measurement | undefined>
  /** Bel + boyun dolu en son ölçüm (Navy yağ oranı hesabı için) */
  latestWithGirths(profileId: number): Promise<Measurement | undefined>
  /** Aynı güne ikinci kayıt: verilen alanlar güncellenir, dolu alanlar korunur */
  upsertForDay(
    profileId: number,
    date: string,
    values: { weightKg: number; waistCm?: number; neckCm?: number; hipCm?: number },
  ): Promise<void>
  remove(id: number): Promise<void>
}

export { profileRepo, mealRepo, waterRepo, foodRepo, measurementRepo } from './dexie'
