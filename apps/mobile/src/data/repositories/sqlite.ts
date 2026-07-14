import type {
  CustomFood,
  FoodGroup,
  FoodMeasure,
  MealEntry,
  Measurement,
  Profile,
  WaterLog,
  FoodRepository,
  MealRepository,
  MeasurementRepository,
  ProfileRepository,
  WaterRepository,
} from '@afiet/core'
import { SEED_FOODS, turkishLower } from '@afiet/core'
import { db } from '../db'
import { notify } from '../live'

/* Satır ↔ tip eşlemeleri: SQLite NULL → undefined, groups JSON string ↔ dizi.
   Davranış birebir web Dexie implementasyonunu izler (afiet-web reposundaki
   .../dexie.ts). */

type ProfileRow = {
  id: number
  name: string
  emoji: string
  createdAt: string
  sex: Profile['sex'] | null
  birthDate: string | null
  heightCm: number | null
  activityLevel: Profile['activityLevel'] | null
}

const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  createdAt: r.createdAt,
  sex: r.sex ?? undefined,
  birthDate: r.birthDate ?? undefined,
  heightCm: r.heightCm ?? undefined,
  activityLevel: r.activityLevel ?? undefined,
})

export const profileRepo: ProfileRepository = {
  all: async () =>
    (await db.getAllAsync<ProfileRow>('SELECT * FROM profiles ORDER BY id')).map(toProfile),
  get: async (id) => {
    const r = await db.getFirstAsync<ProfileRow>('SELECT * FROM profiles WHERE id = ?', id)
    return r ? toProfile(r) : undefined
  },
  first: async () => {
    const r = await db.getFirstAsync<ProfileRow>('SELECT * FROM profiles ORDER BY id LIMIT 1')
    return r ? toProfile(r) : undefined
  },
  create: async (attrs) => {
    const res = await db.runAsync(
      'INSERT INTO profiles (name, emoji, createdAt, sex, birthDate, heightCm, activityLevel) VALUES (?, ?, ?, ?, ?, ?, ?)',
      attrs.name,
      attrs.emoji,
      new Date().toISOString(),
      attrs.sex ?? null,
      attrs.birthDate ?? null,
      attrs.heightCm ?? null,
      attrs.activityLevel ?? null,
    )
    notify('profiles')
    return res.lastInsertRowId
  },
  updateIdentity: async (id, attrs) => {
    await db.runAsync('UPDATE profiles SET name = ?, emoji = ? WHERE id = ?', attrs.name, attrs.emoji, id)
    notify('profiles')
  },
  updateBody: async (id, attrs) => {
    await db.runAsync(
      'UPDATE profiles SET sex = ?, birthDate = ?, heightCm = ?, activityLevel = ? WHERE id = ?',
      attrs.sex ?? null,
      attrs.birthDate ?? null,
      attrs.heightCm ?? null,
      attrs.activityLevel ?? null,
      id,
    )
    notify('profiles')
  },
}

type MealRow = {
  id: number
  profileId: number
  date: string
  meal: MealEntry['meal']
  foodName: string
  portionSize: MealEntry['portionSize'] | null
  quantity: number
  measure: FoodMeasure | null
  groups: string
  note: string | null
  createdAt: string
}

const toMeal = (r: MealRow): MealEntry => ({
  id: r.id,
  profileId: r.profileId,
  date: r.date,
  meal: r.meal,
  foodName: r.foodName,
  portionSize: r.portionSize ?? undefined,
  quantity: r.quantity,
  measure: r.measure ?? undefined,
  groups: JSON.parse(r.groups) as FoodGroup[],
  note: r.note ?? undefined,
  createdAt: r.createdAt,
})

export const mealRepo: MealRepository = {
  forDay: async (profileId, date) =>
    (
      await db.getAllAsync<MealRow>(
        'SELECT * FROM meals WHERE profileId = ? AND date = ? ORDER BY id',
        profileId,
        date,
      )
    ).map(toMeal),
  forRange: async (profileId, from, to) =>
    (
      await db.getAllAsync<MealRow>(
        'SELECT * FROM meals WHERE profileId = ? AND date BETWEEN ? AND ? ORDER BY date, id',
        profileId,
        from,
        to,
      )
    ).map(toMeal),
  add: async (entry) => {
    const res = await db.runAsync(
      'INSERT INTO meals (profileId, date, meal, foodName, portionSize, quantity, measure, groups, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      entry.profileId,
      entry.date,
      entry.meal,
      entry.foodName,
      entry.portionSize ?? null,
      entry.quantity,
      entry.measure ?? null,
      JSON.stringify(entry.groups),
      entry.note ?? null,
      entry.createdAt,
    )
    notify('meals')
    return res.lastInsertRowId
  },
  remove: async (id) => {
    await db.runAsync('DELETE FROM meals WHERE id = ?', id)
    notify('meals')
  },
  loggedDates: async (profileId) =>
    (
      await db.getAllAsync<{ date: string }>(
        'SELECT DISTINCT date FROM meals WHERE profileId = ? ORDER BY date',
        profileId,
      )
    ).map((r) => r.date),
}

export const waterRepo: WaterRepository = {
  forDay: async (profileId, date) =>
    (await db.getFirstAsync<WaterLog>(
      'SELECT * FROM water WHERE profileId = ? AND date = ?',
      profileId,
      date,
    )) ?? undefined,
  forRange: (profileId, from, to) =>
    db.getAllAsync<WaterLog>(
      'SELECT * FROM water WHERE profileId = ? AND date BETWEEN ? AND ? ORDER BY date',
      profileId,
      from,
      to,
    ),
  setGlasses: async (profileId, date, glasses) => {
    await db.runAsync(
      'INSERT INTO water (profileId, date, glasses) VALUES (?, ?, ?) ON CONFLICT(profileId, date) DO UPDATE SET glasses = excluded.glasses',
      profileId,
      date,
      glasses,
    )
    notify('water')
  },
}

type CustomFoodRow = {
  id: number
  name: string
  groups: string
  measure: FoodMeasure | null
  macros: string | null
  description: string | null
}

const toCustomFood = (r: CustomFoodRow): CustomFood => ({
  id: r.id,
  name: r.name,
  groups: JSON.parse(r.groups) as FoodGroup[],
  measure: r.measure ?? undefined,
  macros: r.macros ? (JSON.parse(r.macros) as CustomFood['macros']) : undefined,
  description: r.description ?? undefined,
})

export const foodRepo: FoodRepository = {
  customFoods: async () =>
    (await db.getAllAsync<CustomFoodRow>('SELECT * FROM customFoods ORDER BY id')).map(toCustomFood),
  learn: async (name, groups, measure) => {
    const trimmed = name.trim()
    if (!trimmed) return
    // Seed listesinde varsa öğrenmeye gerek yok
    if (SEED_FOODS.some((f) => turkishLower(f.name) === turkishLower(trimmed))) return
    const existing = await db.getFirstAsync<CustomFoodRow>(
      'SELECT * FROM customFoods WHERE name = ?',
      trimmed,
    )
    if (existing) {
      if (measure) {
        await db.runAsync(
          'UPDATE customFoods SET groups = ?, measure = ? WHERE id = ?',
          JSON.stringify(groups),
          measure,
          existing.id,
        )
      } else {
        await db.runAsync('UPDATE customFoods SET groups = ? WHERE id = ?', JSON.stringify(groups), existing.id)
      }
    } else {
      await db.runAsync(
        'INSERT INTO customFoods (name, groups, measure) VALUES (?, ?, ?)',
        trimmed,
        JSON.stringify(groups),
        measure ?? null,
      )
    }
    notify('customFoods')
  },
  saveCustom: async (food) => {
    const trimmed = food.name.trim()
    if (!trimmed) return
    // Aynı ada sahip kayıt varsa onunla birleşir (UNIQUE name çakışmasın)
    const existing = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM customFoods WHERE name = ?',
      trimmed,
    )
    if (food.id && existing && existing.id !== food.id) {
      await db.runAsync('DELETE FROM customFoods WHERE id = ?', food.id)
    }
    const targetId = existing?.id ?? food.id
    const macros = food.macros ? JSON.stringify(food.macros) : null
    if (targetId) {
      await db.runAsync(
        'UPDATE customFoods SET name = ?, groups = ?, measure = ?, macros = ?, description = ? WHERE id = ?',
        trimmed,
        JSON.stringify(food.groups),
        food.measure ?? null,
        macros,
        food.description ?? null,
        targetId,
      )
    } else {
      await db.runAsync(
        'INSERT INTO customFoods (name, groups, measure, macros, description) VALUES (?, ?, ?, ?, ?)',
        trimmed,
        JSON.stringify(food.groups),
        food.measure ?? null,
        macros,
        food.description ?? null,
      )
    }
    notify('customFoods')
  },
  removeCustom: async (id) => {
    await db.runAsync('DELETE FROM customFoods WHERE id = ?', id)
    notify('customFoods')
  },
}

type MeasurementRow = {
  id: number
  profileId: number
  date: string
  weightKg: number
  waistCm: number | null
  neckCm: number | null
  hipCm: number | null
  createdAt: string
}

const toMeasurement = (r: MeasurementRow): Measurement => ({
  id: r.id,
  profileId: r.profileId,
  date: r.date,
  weightKg: r.weightKg,
  waistCm: r.waistCm ?? undefined,
  neckCm: r.neckCm ?? undefined,
  hipCm: r.hipCm ?? undefined,
  createdAt: r.createdAt,
})

export const measurementRepo: MeasurementRepository = {
  forProfile: async (profileId) =>
    (
      await db.getAllAsync<MeasurementRow>(
        'SELECT * FROM measurements WHERE profileId = ? ORDER BY date',
        profileId,
      )
    ).map(toMeasurement),
  forRange: async (profileId, from, to) =>
    (
      await db.getAllAsync<MeasurementRow>(
        'SELECT * FROM measurements WHERE profileId = ? AND date BETWEEN ? AND ? ORDER BY date',
        profileId,
        from,
        to,
      )
    ).map(toMeasurement),
  latest: async (profileId) => {
    const r = await db.getFirstAsync<MeasurementRow>(
      'SELECT * FROM measurements WHERE profileId = ? ORDER BY date DESC LIMIT 1',
      profileId,
    )
    return r ? toMeasurement(r) : undefined
  },
  latestWithGirths: async (profileId) => {
    const r = await db.getFirstAsync<MeasurementRow>(
      'SELECT * FROM measurements WHERE profileId = ? AND waistCm IS NOT NULL AND neckCm IS NOT NULL ORDER BY date DESC LIMIT 1',
      profileId,
    )
    return r ? toMeasurement(r) : undefined
  },
  upsertForDay: async (profileId, date, values) => {
    const existing = await db.getFirstAsync<MeasurementRow>(
      'SELECT * FROM measurements WHERE profileId = ? AND date = ?',
      profileId,
      date,
    )
    if (existing) {
      // Yalnızca verilen alanları yaz — akşam kilo girişi sabah mezura değerlerini silmesin
      const defined = Object.entries(values).filter(([, v]) => v !== undefined)
      if (defined.length > 0) {
        const set = defined.map(([k]) => `${k} = ?`).join(', ')
        await db.runAsync(
          `UPDATE measurements SET ${set} WHERE id = ?`,
          ...defined.map(([, v]) => v as number),
          existing.id,
        )
      }
    } else {
      await db.runAsync(
        'INSERT INTO measurements (profileId, date, weightKg, waistCm, neckCm, hipCm, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        profileId,
        date,
        values.weightKg,
        values.waistCm ?? null,
        values.neckCm ?? null,
        values.hipCm ?? null,
        new Date().toISOString(),
      )
    }
    notify('measurements')
  },
  remove: async (id) => {
    await db.runAsync('DELETE FROM measurements WHERE id = ?', id)
    notify('measurements')
  },
}
