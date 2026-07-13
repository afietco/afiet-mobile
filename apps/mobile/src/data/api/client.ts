/**
 * Backend (afiet-api) tipli istemcisi. Endpoint gövdeleri camelCase — backend
 * JSON'uyla birebir. Kimlik, verilen authedFetch üzerinden taşınır (token
 * enjeksiyonu + 401'de yenileme AuthContext'te). Bu tipler backend modeliyle
 * eşleşir; @afiet/core'un yerel (numeric id) tiplerinden AYRIDIR — köprü
 * repository katmanında yapılır (Aşama 2).
 */

export interface ApiProfile {
  userId: string
  email: string
  displayName: string | null
  emoji: string | null
  sex: string | null
  birthDate: string | null
  heightCm: number | null
  activityLevel: string | null
  createdAt: string
  updatedAt: string
}

export interface ApiProfileInput {
  displayName?: string
  emoji?: string
  sex?: string
  birthDate?: string
  heightCm?: number
  activityLevel?: string
}

export interface ApiMeal {
  id: string
  entryDate: string
  meal: string
  foodName: string
  quantity: number
  measure: string | null
  groups: string[]
  note: string | null
  createdAt: string
}

export interface ApiMealInput {
  entryDate: string
  meal: string
  foodName: string
  quantity: number
  measure?: string
  groups: string[]
  note?: string
}

export interface ApiWater {
  date: string
  glasses: number
}

export interface ApiMeasurement {
  id: string
  measuredOn: string
  weightKg: number
  waistCm: number | null
  neckCm: number | null
  hipCm: number | null
  createdAt: string
}

export interface ApiMacros {
  kcal: number
  protein: number
  carb: number
  fat: number
}

export interface ApiCustomFood {
  id: string
  name: string
  groups: string[]
  measure: string | null
  macros: ApiMacros | null
  description: string | null
  createdAt: string
  updatedAt: string
}

/** authedFetch: token'ı ekler, 401'de yeniler ve bir kez tekrar dener. */
export type AuthedFetch = (path: string, init?: RequestInit) => Promise<Response>

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export function createApiClient(authedFetch: AuthedFetch) {
  async function req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await authedFetch(path, init)
    if (!res.ok) {
      let msg = `HTTP ${res.status}`
      try {
        const body = (await res.json()) as { error?: { message?: string } }
        if (body.error?.message) msg = body.error.message
      } catch {
        // gövde yoksa durum kodu yeterli
      }
      throw new ApiError(res.status, msg)
    }
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  }

  const json = (body: unknown): RequestInit => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return {
    getProfile: () => req<ApiProfile>('/v1/profile'),
    updateProfile: (input: ApiProfileInput) =>
      req<ApiProfile>('/v1/profile', { ...json(input), method: 'PUT' }),

    listMeals: (date: string) => req<ApiMeal[]>(`/v1/meals?date=${encodeURIComponent(date)}`),
    addMeal: (input: ApiMealInput) => req<ApiMeal>('/v1/meals', json(input)),
    deleteMeal: (id: string) => req<void>(`/v1/meals/${id}`, { method: 'DELETE' }),

    getWater: (date: string) => req<ApiWater>(`/v1/water?date=${encodeURIComponent(date)}`),
    setWater: (date: string, glasses: number) =>
      req<ApiWater>('/v1/water', { ...json({ date, glasses }), method: 'PUT' }),

    listMeasurements: () => req<ApiMeasurement[]>('/v1/measurements'),
    addMeasurement: (input: Omit<ApiMeasurement, 'id' | 'createdAt'>) =>
      req<ApiMeasurement>('/v1/measurements', json(input)),

    listCustomFoods: () => req<ApiCustomFood[]>('/v1/custom-foods'),
    addCustomFood: (input: Omit<ApiCustomFood, 'id' | 'createdAt' | 'updatedAt'>) =>
      req<ApiCustomFood>('/v1/custom-foods', json(input)),
    updateCustomFood: (id: string, input: Omit<ApiCustomFood, 'id' | 'createdAt' | 'updatedAt'>) =>
      req<ApiCustomFood>(`/v1/custom-foods/${id}`, { ...json(input), method: 'PUT' }),
    deleteCustomFood: (id: string) => req<void>(`/v1/custom-foods/${id}`, { method: 'DELETE' }),
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
