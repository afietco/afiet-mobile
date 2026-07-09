import Dexie, { type Table } from 'dexie'
import type { CustomFood, Measurement, MealEntry, Profile, WaterLog } from './types'

export class AppDB extends Dexie {
  profiles!: Table<Profile, number>
  meals!: Table<MealEntry, number>
  water!: Table<WaterLog, number>
  customFoods!: Table<CustomFood, number>
  measurements!: Table<Measurement, number>

  constructor() {
    super('family-health')
    this.version(1).stores({
      profiles: '++id, name',
      meals: '++id, [profileId+date], profileId',
      water: '++id, [profileId+date]',
      customFoods: '++id, &name',
    })
    this.version(2).stores({
      measurements: '++id, [profileId+date], profileId',
    })
  }
}

export const db = new AppDB()
