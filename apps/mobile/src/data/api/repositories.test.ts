import { beforeEach, describe, expect, it, vi } from 'vitest'
import { measurementRepo } from './repositories'

const mocks = vi.hoisted(() => ({
  api: {
    listMeasurements: vi.fn(),
  },
}))

vi.mock('./apiHolder', () => ({ requireApi: () => mocks.api }))

beforeEach(() => {
  mocks.api.listMeasurements.mockReset()
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
