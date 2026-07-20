import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AfiPhotoFood } from './afiPhoto'
import {
  AFI_PHOTO_DRAFT_STORAGE_KEY,
  AFI_PHOTO_DRAFT_TTL_MS,
  clearAfiPhotoDraft,
  loadAfiPhotoDraft,
  saveAfiPhotoDraft,
  type AfiPhotoDraftData,
  type AfiPhotoDraftScope,
} from './afiPhotoDraft'

const storage = vi.hoisted(() => {
  const values = new Map<string, string>()
  return {
    values,
    getItem: vi.fn(async (key: string) => values.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      values.set(key, value)
    }),
    removeItem: vi.fn(async (key: string) => {
      values.delete(key)
    }),
  }
})

vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }))

const scope: AfiPhotoDraftScope = { profileId: 7, date: '2026-07-20', meal: 'aksam' }
const food: AfiPhotoFood = {
  name: 'Mercimek çorbası',
  groups: ['bakliyat'],
  measure: 'kase',
  macros: { kcal: 180, protein: 9, carb: 28, fat: 4 },
  inPool: true,
}
const draft: AfiPhotoDraftData = {
  messages: [
    { role: 'user', imageUri: 'file:///photo.jpg' },
    { role: 'afi', text: 'Mercimek çorbası görüyorum.' },
  ],
  queue: [food],
  conversationId: 'conversation-1',
  quantity: 1.5,
  loggedNames: ['ekmek'],
  rejectedNames: ['pilav'],
}

beforeEach(async () => {
  await clearAfiPhotoDraft()
  storage.values.clear()
})

describe('Afi photo draft persistence', () => {
  it('restores an unsaved queue and its conversation within the TTL', async () => {
    const now = Date.parse('2026-07-20T18:00:00.000Z')
    await saveAfiPhotoDraft(scope, draft, now)

    await expect(loadAfiPhotoDraft(scope, now + AFI_PHOTO_DRAFT_TTL_MS - 1)).resolves.toEqual(
      draft,
    )
  })

  it('removes expired and mismatched drafts', async () => {
    const now = Date.parse('2026-07-20T18:00:00.000Z')
    await saveAfiPhotoDraft(scope, draft, now)

    await expect(
      loadAfiPhotoDraft({ ...scope, meal: 'ogle' }, now + 1),
    ).resolves.toBeNull()
    expect(storage.values.has(AFI_PHOTO_DRAFT_STORAGE_KEY)).toBe(false)

    await saveAfiPhotoDraft(scope, draft, now)
    await expect(loadAfiPhotoDraft(scope, now + AFI_PHOTO_DRAFT_TTL_MS)).resolves.toBeNull()
    expect(storage.values.has(AFI_PHOTO_DRAFT_STORAGE_KEY)).toBe(false)
  })

  it('clears persistence when no recognized foods remain', async () => {
    await saveAfiPhotoDraft(scope, draft)
    await saveAfiPhotoDraft(scope, { ...draft, queue: [] })

    expect(storage.values.has(AFI_PHOTO_DRAFT_STORAGE_KEY)).toBe(false)
  })
})
