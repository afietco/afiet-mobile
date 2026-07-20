import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  FOOD_GROUPS,
  FOOD_MEASURES,
  MEAL_TYPES,
  type FoodGroup,
  type FoodMeasure,
  type MealType,
} from '@afiet/core'
import type { AfiPhotoFood } from './afiPhoto'

export const AFI_PHOTO_DRAFT_STORAGE_KEY = 'afiet:nutrition:afi-photo-draft:v1'
export const AFI_PHOTO_DRAFT_TTL_MS = 2 * 60 * 60 * 1000

export interface AfiPhotoDraftScope {
  profileId: number
  date: string
  meal: MealType
}

export interface AfiPhotoDraftMessage {
  role: 'afi' | 'user'
  text?: string
  imageUri?: string
}

export interface AfiPhotoDraftData {
  messages: AfiPhotoDraftMessage[]
  queue: AfiPhotoFood[]
  conversationId: string | null
  quantity: number
  loggedNames: string[]
  rejectedNames: string[]
}

interface StoredAfiPhotoDraft extends AfiPhotoDraftData {
  version: 1
  expiresAt: number
  scope: AfiPhotoDraftScope
}

const GROUP_KEYS = new Set<string>(FOOD_GROUPS.map((group) => group.key))
const MEASURE_KEYS = new Set<string>(FOOD_MEASURES.map((measure) => measure.key))
const MEAL_KEYS = new Set<string>(MEAL_TYPES.map((meal) => meal.key))
let storageQueue: Promise<void> = Promise.resolve()

function enqueueStorage<T>(operation: () => Promise<T>): Promise<T> {
  const run = storageQueue.catch(() => undefined).then(operation)
  storageQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function parseFood(value: unknown): AfiPhotoFood | null {
  if (!isRecord(value) || typeof value.name !== 'string' || !Array.isArray(value.groups)) {
    return null
  }
  const measure = typeof value.measure === 'string' ? value.measure : ''
  const macros = isRecord(value.macros) ? value.macros : null
  const kcal = finiteNumber(macros?.kcal)
  const protein = finiteNumber(macros?.protein)
  const carb = finiteNumber(macros?.carb)
  const fat = finiteNumber(macros?.fat)
  const name = value.name.trim()
  if (
    !name ||
    !MEASURE_KEYS.has(measure) ||
    kcal === null ||
    protein === null ||
    carb === null ||
    fat === null ||
    typeof value.inPool !== 'boolean'
  ) {
    return null
  }
  const groups = value.groups.filter(
    (group): group is FoodGroup => typeof group === 'string' && GROUP_KEYS.has(group),
  )
  return {
    name,
    groups,
    measure: measure as FoodMeasure,
    macros: { kcal, protein, carb, fat },
    description:
      typeof value.description === 'string' ? value.description.trim() || undefined : undefined,
    inPool: value.inPool,
  }
}

function parseMessage(value: unknown): AfiPhotoDraftMessage | null {
  if (!isRecord(value) || (value.role !== 'afi' && value.role !== 'user')) return null
  const text = typeof value.text === 'string' ? value.text : undefined
  const imageUri = typeof value.imageUri === 'string' ? value.imageUri : undefined
  if (!text && !imageUri) return null
  return { role: value.role, text, imageUri }
}

function parseStoredDraft(raw: string): StoredAfiPhotoDraft | null {
  try {
    const value = JSON.parse(raw) as unknown
    if (!isRecord(value) || value.version !== 1 || !isRecord(value.scope)) return null
    const profileId = finiteNumber(value.scope.profileId)
    const date = typeof value.scope.date === 'string' ? value.scope.date : ''
    const meal = typeof value.scope.meal === 'string' ? value.scope.meal : ''
    const expiresAt = finiteNumber(value.expiresAt)
    const quantity = finiteNumber(value.quantity)
    const queue = Array.isArray(value.queue)
      ? value.queue.map(parseFood).filter((food) => food !== null)
      : []
    const messages = Array.isArray(value.messages)
      ? value.messages.map(parseMessage).filter((message) => message !== null)
      : []
    if (
      profileId === null ||
      !date ||
      !MEAL_KEYS.has(meal) ||
      expiresAt === null ||
      quantity === null ||
      queue.length === 0
    ) {
      return null
    }
    return {
      version: 1,
      expiresAt,
      scope: { profileId, date, meal: meal as MealType },
      messages,
      queue,
      conversationId: typeof value.conversationId === 'string' ? value.conversationId : null,
      quantity,
      loggedNames: Array.isArray(value.loggedNames)
        ? value.loggedNames.filter((name): name is string => typeof name === 'string')
        : [],
      rejectedNames: Array.isArray(value.rejectedNames)
        ? value.rejectedNames.filter((name): name is string => typeof name === 'string')
        : [],
    }
  } catch {
    return null
  }
}

function sameScope(left: AfiPhotoDraftScope, right: AfiPhotoDraftScope): boolean {
  return (
    left.profileId === right.profileId && left.date === right.date && left.meal === right.meal
  )
}

export async function saveAfiPhotoDraft(
  scope: AfiPhotoDraftScope,
  data: AfiPhotoDraftData,
  now = Date.now(),
): Promise<void> {
  if (data.queue.length === 0) {
    await clearAfiPhotoDraft()
    return
  }
  const stored: StoredAfiPhotoDraft = {
    version: 1,
    expiresAt: now + AFI_PHOTO_DRAFT_TTL_MS,
    scope,
    ...data,
  }
  await enqueueStorage(() =>
    AsyncStorage.setItem(AFI_PHOTO_DRAFT_STORAGE_KEY, JSON.stringify(stored)),
  )
}

export async function loadAfiPhotoDraft(
  scope: AfiPhotoDraftScope,
  now = Date.now(),
): Promise<AfiPhotoDraftData | null> {
  try {
    const raw = await enqueueStorage(() => AsyncStorage.getItem(AFI_PHOTO_DRAFT_STORAGE_KEY))
    if (!raw) return null
    const stored = parseStoredDraft(raw)
    if (!stored || stored.expiresAt <= now || !sameScope(stored.scope, scope)) {
      await clearAfiPhotoDraft()
      return null
    }
    return {
      messages: stored.messages,
      queue: stored.queue,
      conversationId: stored.conversationId,
      quantity: stored.quantity,
      loggedNames: stored.loggedNames,
      rejectedNames: stored.rejectedNames,
    }
  } catch {
    return null
  }
}

export function clearAfiPhotoDraft(): Promise<void> {
  return enqueueStorage(() => AsyncStorage.removeItem(AFI_PHOTO_DRAFT_STORAGE_KEY))
}
