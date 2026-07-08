/**
 * Veri erişim katmanı — UI yalnızca bu arayüzleri kullanır.
 * İleride backend (PocketBase/Firebase vb.) eklenirse burada yeni bir
 * implementasyon takılır, UI değişmez.
 */
import type { CustomFood, FoodGroup, MealEntry, Profile, WaterLog } from '../types'

export interface ProfileRepository {
  all(): Promise<Profile[]>
  create(name: string, emoji: string): Promise<number>
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
  learn(name: string, groups: FoodGroup[]): Promise<void>
}

export { profileRepo, mealRepo, waterRepo, foodRepo } from './dexie'
