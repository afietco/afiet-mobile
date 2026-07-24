import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './client'
import { foodRepo, mealRepo, measurementRepo, profileRepo } from './repositories'

const mocks = vi.hoisted(() => ({
  api: {
    createProfile: vi.fn(),
    listMeals: vi.fn(),
    listCustomFoods: vi.fn(),
    listMeasurements: vi.fn(),
    updateProfile: vi.fn(),
  },
}))

vi.mock('./apiHolder', () => ({ requireApi: () => mocks.api }))

beforeEach(() => {
  mocks.api.createProfile.mockReset()
  mocks.api.listMeals.mockReset()
  mocks.api.listCustomFoods.mockReset()
  mocks.api.listMeasurements.mockReset()
  mocks.api.updateProfile.mockReset()
})

describe('profile repository', () => {
  it('creates an identity-only profile through the current API', async () => {
    mocks.api.createProfile.mockResolvedValue({})

    await expect(profileRepo.create({ name: 'Berk', emoji: '🦉' })).resolves.toBe(1)

    expect(mocks.api.createProfile).toHaveBeenCalledWith({
      displayName: 'Berk',
      emoji: '🦉',
      sex: undefined,
      birthDate: undefined,
      heightCm: undefined,
      activityLevel: undefined,
      sports: undefined,
    })
    expect(mocks.api.updateProfile).not.toHaveBeenCalled()
  })

  it('falls back to an identity update while the deployed API still uses the old contract', async () => {
    mocks.api.createProfile.mockRejectedValue(
      new ApiError(400, 'profil kurulum alanları eksik'),
    )
    mocks.api.updateProfile.mockResolvedValue({})

    await expect(profileRepo.create({ name: 'Berk', emoji: '🦉' })).resolves.toBe(1)

    expect(mocks.api.updateProfile).toHaveBeenCalledWith({ displayName: 'Berk', emoji: '🦉' })
  })

  it('falls back to an identity update when the deployed API does not have profile creation yet', async () => {
    mocks.api.createProfile.mockRejectedValue(new ApiError(405, 'HTTP 405'))
    mocks.api.updateProfile.mockResolvedValue({})

    await expect(profileRepo.create({ name: 'Berk', emoji: '🦉' })).resolves.toBe(1)

    expect(mocks.api.updateProfile).toHaveBeenCalledWith({ displayName: 'Berk', emoji: '🦉' })
  })

  it('does not hide unrelated profile creation failures', async () => {
    const failure = new ApiError(400, 'geçersiz emoji')
    mocks.api.createProfile.mockRejectedValue(failure)

    await expect(profileRepo.create({ name: 'Berk', emoji: '🦉' })).rejects.toBe(failure)
    expect(mocks.api.updateProfile).not.toHaveBeenCalled()
  })

  it('persists body details and selected sports together', async () => {
    mocks.api.updateProfile.mockResolvedValue({})

    await profileRepo.updateBody(1, {
      sex: 'erkek',
      birthDate: '1995-06-15',
      heightCm: 180,
      activityLevel: 'orta',
      sports: ['running', 'fitness'],
    })

    expect(mocks.api.updateProfile).toHaveBeenCalledWith({
      sex: 'erkek',
      birthDate: '1995-06-15',
      heightCm: 180,
      activityLevel: 'orta',
      sports: ['running', 'fitness'],
    })
  })
})

describe('measurement repository', () => {
  it('loads only one row for the latest measurement', async () => {
    mocks.api.listMeasurements.mockResolvedValue([
      {
        id: '4f7e9eb4-2ed4-4b79-b633-bca7255e104a',
        measuredOn: '2026-07-20',
        weightKg: 72.4,
        waistCm: null,
        neckCm: null,
        hipCm: null,
        createdAt: '2026-07-20T12:00:00Z',
      },
    ])

    const latest = await measurementRepo.latest(1)

    expect(mocks.api.listMeasurements).toHaveBeenCalledWith(1)
    expect(latest).toMatchObject({ date: '2026-07-20', weightKg: 72.4 })
  })
})

describe('group sanitization at the API boundary', () => {
  it('drops unrecognised meal groups so a stray enum value cannot crash the meal list', async () => {
    mocks.api.listMeals.mockResolvedValue([
      {
        id: 'meal-1',
        entryDate: '2026-07-23',
        meal: 'ogle',
        foodName: 'Afi tabağı',
        quantity: 1,
        measure: 'porsiyon',
        groups: ['sebze', 'uzayli-grup', 'protein'],
        note: null,
        createdAt: '2026-07-23T10:00:00Z',
      },
    ])

    const [entry] = await mealRepo.forDay(1, '2026-07-23')

    expect(entry.groups).toEqual(['sebze', 'protein'])
  })

  it('coerces a malformed meal groups value to an empty array', async () => {
    mocks.api.listMeals.mockResolvedValue([
      {
        id: 'meal-2',
        entryDate: '2026-07-23',
        meal: 'aksam',
        foodName: 'Not',
        quantity: 1,
        measure: 'porsiyon',
        groups: null,
        note: null,
        createdAt: '2026-07-23T10:00:00Z',
      },
    ])

    const [entry] = await mealRepo.forDay(1, '2026-07-23')

    expect(entry.groups).toEqual([])
  })

  it('drops unrecognised custom food groups', async () => {
    mocks.api.listCustomFoods.mockResolvedValue([
      {
        id: 'food-1',
        name: 'Afi yemeği',
        groups: ['tahil', 'bozuk', 'sut'],
        measure: 'porsiyon',
        macros: null,
        description: null,
      },
    ])

    const [food] = await foodRepo.customFoods()

    expect(food.groups).toEqual(['tahil', 'sut'])
  })
})
