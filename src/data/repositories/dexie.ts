import { db } from '../db'
import type { FoodGroup, MealEntry } from '../types'
import type {
  FoodRepository,
  MealRepository,
  MeasurementRepository,
  ProfileRepository,
  WaterRepository,
} from './index'
import { SEED_FOODS } from '../foods'

const trLower = (s: string) => s.toLocaleLowerCase('tr-TR')

export const profileRepo: ProfileRepository = {
  all: () => db.profiles.toArray(),
  create: (attrs) => db.profiles.add({ ...attrs, createdAt: new Date().toISOString() }),
  updateIdentity: async (id, attrs) => {
    await db.profiles.update(id, attrs)
  },
  updateBody: async (id, attrs) => {
    await db.profiles.update(id, attrs)
  },
}

export const mealRepo: MealRepository = {
  forDay: (profileId, date) =>
    db.meals.where('[profileId+date]').equals([profileId, date]).toArray(),
  forRange: (profileId, from, to) =>
    db.meals
      .where('[profileId+date]')
      .between([profileId, from], [profileId, to], true, true)
      .toArray(),
  add: (entry: Omit<MealEntry, 'id'>) => db.meals.add(entry as MealEntry),
  remove: (id) => db.meals.delete(id),
  loggedDates: async (profileId) => {
    const entries = await db.meals.where('profileId').equals(profileId).toArray()
    return [...new Set(entries.map((e) => e.date))].sort()
  },
}

export const waterRepo: WaterRepository = {
  forDay: (profileId, date) =>
    db.water.where('[profileId+date]').equals([profileId, date]).first(),
  forRange: (profileId, from, to) =>
    db.water
      .where('[profileId+date]')
      .between([profileId, from], [profileId, to], true, true)
      .toArray(),
  setGlasses: async (profileId, date, glasses) => {
    const existing = await db.water
      .where('[profileId+date]')
      .equals([profileId, date])
      .first()
    if (existing) {
      await db.water.update(existing.id!, { glasses })
    } else {
      await db.water.add({ profileId, date, glasses })
    }
  },
}

const measurementsAsc = (profileId: number) =>
  db.measurements
    .where('profileId')
    .equals(profileId)
    .toArray()
    .then((ms) => ms.sort((a, b) => a.date.localeCompare(b.date)))

export const measurementRepo: MeasurementRepository = {
  forProfile: measurementsAsc,
  forRange: (profileId, from, to) =>
    db.measurements
      .where('[profileId+date]')
      .between([profileId, from], [profileId, to], true, true)
      .toArray(),
  latest: (profileId) => measurementsAsc(profileId).then((ms) => ms.at(-1)),
  latestWithGirths: (profileId) =>
    measurementsAsc(profileId).then((ms) =>
      ms.filter((m) => m.waistCm != null && m.neckCm != null).at(-1),
    ),
  upsertForDay: async (profileId, date, values) => {
    const existing = await db.measurements
      .where('[profileId+date]')
      .equals([profileId, date])
      .first()
    if (existing) {
      // Yalnızca verilen alanları yaz — akşam kilo girişi sabah mezura değerlerini silmesin
      const defined = Object.fromEntries(
        Object.entries(values).filter(([, v]) => v !== undefined),
      )
      await db.measurements.update(existing.id!, defined)
    } else {
      await db.measurements.add({
        profileId,
        date,
        ...values,
        createdAt: new Date().toISOString(),
      })
    }
  },
  remove: (id) => db.measurements.delete(id),
}

export const foodRepo: FoodRepository = {
  customFoods: () => db.customFoods.toArray(),
  learn: async (name: string, groups: FoodGroup[]) => {
    const trimmed = name.trim()
    if (!trimmed) return
    // Seed listesinde varsa öğrenmeye gerek yok
    if (SEED_FOODS.some((f) => trLower(f.name) === trLower(trimmed))) return
    const existing = await db.customFoods.where('name').equals(trimmed).first()
    if (existing) {
      await db.customFoods.update(existing.id!, { groups })
    } else {
      await db.customFoods.add({ name: trimmed, groups })
    }
  },
}
