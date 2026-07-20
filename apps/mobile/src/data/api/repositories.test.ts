import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './client'
import { measurementRepo, profileRepo } from './repositories'

const mocks = vi.hoisted(() => ({
  api: {
    createProfile: vi.fn(),
    listMeasurements: vi.fn(),
    updateProfile: vi.fn(),
  },
}))

vi.mock('./apiHolder', () => ({ requireApi: () => mocks.api }))

beforeEach(() => {
  mocks.api.createProfile.mockReset()
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
