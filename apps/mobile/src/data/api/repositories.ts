/**
 * @afiet/core repository arayüzlerinin backend (API) implementasyonu.
 * Web'in Dexie/sqlite implementasyonlarının online karşılığı — UI ve core
 * DEĞİŞMEZ. Kişi-başı model: profileId parametreleri yok sayılır (kullanıcı
 * JWT'den gelir); UUID'ler idMap ile yerel numaraya köprülenir; mutasyonlar
 * notify() çağırarak useLive reaktivitesini korur (tablo adları sqlite ile aynı).
 */
import type {
  ActivityLevel,
  CustomFood,
  FoodGroup,
  FoodMeasure,
  FoodRepository,
  MealEntry,
  MealRepository,
  MealType,
  Measurement,
  MeasurementRepository,
  Profile,
  ProfileRepository,
  Sex,
  WaterLog,
  WaterRepository,
} from '@afiet/core'
import { notify } from '../live'
import { requireApi } from './apiHolder'
import { ApiError, type ApiCustomFood, type ApiMeal, type ApiMeasurement, type ApiProfile } from './client'
import { toNum, toUuid } from './idMap'

// Kişi-başı: cihazda tek profil. profileId opaque bir işaret (repo'lar yok sayar).
const SELF_PROFILE_ID = 1

function mapProfile(p: ApiProfile): Profile {
  return {
    id: SELF_PROFILE_ID,
    name: p.displayName ?? '',
    emoji: p.emoji ?? '',
    createdAt: p.createdAt,
    sex: (p.sex as Sex | null) ?? undefined,
    birthDate: p.birthDate ?? undefined,
    heightCm: p.heightCm ?? undefined,
    activityLevel: (p.activityLevel as ActivityLevel | null) ?? undefined,
  }
}

function mapMeal(m: ApiMeal): MealEntry {
  return {
    id: toNum(m.id),
    profileId: SELF_PROFILE_ID,
    date: m.entryDate,
    meal: m.meal as MealType,
    foodName: m.foodName,
    quantity: m.quantity,
    measure: (m.measure as FoodMeasure | null) ?? undefined,
    groups: m.groups as FoodGroup[],
    note: m.note ?? undefined,
    createdAt: m.createdAt,
  }
}

function mapMeasurement(m: ApiMeasurement): Measurement {
  return {
    id: toNum(m.id),
    profileId: SELF_PROFILE_ID,
    date: m.measuredOn,
    weightKg: m.weightKg,
    waistCm: m.waistCm ?? undefined,
    neckCm: m.neckCm ?? undefined,
    hipCm: m.hipCm ?? undefined,
    createdAt: m.createdAt,
  }
}

function mapCustomFood(c: ApiCustomFood): CustomFood {
  return {
    id: toNum(c.id),
    name: c.name,
    groups: c.groups as FoodGroup[],
    measure: (c.measure as FoodMeasure | null) ?? undefined,
    macros: c.macros ?? undefined,
    description: c.description ?? undefined,
  }
}

export const profileRepo: ProfileRepository = {
  async all() {
    return [mapProfile(await requireApi().getProfile())]
  },
  async get() {
    return mapProfile(await requireApi().getProfile())
  },
  async first() {
    return mapProfile(await requireApi().getProfile())
  },
  async create(attrs) {
    await requireApi().updateProfile({
      displayName: attrs.name,
      emoji: attrs.emoji,
      sex: attrs.sex,
      birthDate: attrs.birthDate,
      heightCm: attrs.heightCm,
      activityLevel: attrs.activityLevel,
    })
    notify('profiles')
    return SELF_PROFILE_ID
  },
  async updateIdentity(_id, attrs) {
    await requireApi().updateProfile({ displayName: attrs.name, emoji: attrs.emoji })
    notify('profiles')
  },
  async updateBody(_id, attrs) {
    await requireApi().updateProfile({
      sex: attrs.sex,
      birthDate: attrs.birthDate,
      heightCm: attrs.heightCm,
      activityLevel: attrs.activityLevel,
    })
    notify('profiles')
  },
}

export const mealRepo: MealRepository = {
  async forDay(_profileId, date) {
    return (await requireApi().listMeals(date)).map(mapMeal)
  },
  async forRange(_profileId, from, to) {
    return (await requireApi().listMealsRange(from, to)).map(mapMeal)
  },
  async add(entry) {
    const created = await requireApi().addMeal({
      entryDate: entry.date,
      meal: entry.meal,
      foodName: entry.foodName,
      quantity: entry.quantity,
      measure: entry.measure,
      groups: entry.groups,
      note: entry.note,
    })
    notify('meals')
    return toNum(created.id)
  },
  async remove(id) {
    const uuid = toUuid(id)
    if (uuid) await requireApi().deleteMeal(uuid)
    notify('meals')
  },
  async loggedDates() {
    return requireApi().loggedDates()
  },
}

export const waterRepo: WaterRepository = {
  async forDay(_profileId, date) {
    const w = await requireApi().getWater(date)
    return { profileId: SELF_PROFILE_ID, date: w.date, glasses: w.glasses }
  },
  async forRange(_profileId, from, to) {
    return (await requireApi().getWaterRange(from, to)).map((w) => ({
      profileId: SELF_PROFILE_ID,
      date: w.date,
      glasses: w.glasses,
    }))
  },
  async setGlasses(_profileId, date, glasses) {
    await requireApi().setWater(date, glasses)
    notify('water')
  },
}

export const foodRepo: FoodRepository = {
  async customFoods() {
    return (await requireApi().listCustomFoods()).map(mapCustomFood)
  },
  async learn(name, groups, measure) {
    try {
      await requireApi().addCustomFood({
        name,
        groups,
        measure: measure ?? null,
        macros: null,
        description: null,
      })
      notify('customFoods')
    } catch (e) {
      // Zaten öğrenilmişse (aynı isim → 409) sessizce geç.
      if (e instanceof ApiError && e.status === 409) return
      throw e
    }
  },
  async saveCustom(food) {
    const input = {
      name: food.name,
      groups: food.groups,
      measure: food.measure ?? null,
      macros: food.macros ?? null,
      description: food.description ?? null,
    }
    const uuid = food.id != null ? toUuid(food.id) : undefined
    if (uuid) await requireApi().updateCustomFood(uuid, input)
    else await requireApi().addCustomFood(input)
    notify('customFoods')
  },
  async removeCustom(id) {
    const uuid = toUuid(id)
    if (uuid) await requireApi().deleteCustomFood(uuid)
    notify('customFoods')
  },
}

export const measurementRepo: MeasurementRepository = {
  async forProfile() {
    // Arayüz: tarihe göre ARTAN; API desc döner → ters çevir.
    return (await requireApi().listMeasurements()).map(mapMeasurement).reverse()
  },
  async forRange(_profileId, from, to) {
    return (await requireApi().listMeasurements())
      .map(mapMeasurement)
      .filter((m) => m.date >= from && m.date <= to)
      .reverse()
  },
  async latest() {
    const ms = await requireApi().listMeasurements() // desc → [0] en yeni
    return ms[0] ? mapMeasurement(ms[0]) : undefined
  },
  async latestWithGirths() {
    const ms = await requireApi().listMeasurements()
    const found = ms.find((m) => m.waistCm != null && m.neckCm != null)
    return found ? mapMeasurement(found) : undefined
  },
  async upsertForDay(_profileId, date, values) {
    // "dolu alanlar korunur": var olan günün ölçümüyle birleştir (backend upsert
    // EXCLUDED ile yazdığından, eksik alanları mevcut değerle doldururuz).
    const existing = (await requireApi().listMeasurements()).find((m) => m.measuredOn === date)
    await requireApi().addMeasurement({
      measuredOn: date,
      weightKg: values.weightKg,
      waistCm: values.waistCm ?? existing?.waistCm ?? null,
      neckCm: values.neckCm ?? existing?.neckCm ?? null,
      hipCm: values.hipCm ?? existing?.hipCm ?? null,
    })
    notify('measurements')
  },
  async remove(id) {
    const uuid = toUuid(id)
    if (uuid) await requireApi().deleteMeasurement(uuid)
    notify('measurements')
  },
}
