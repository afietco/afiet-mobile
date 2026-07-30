import { describe, expect, it } from 'vitest'
import { ApiError, ApiRequestTimeoutError } from '../../data/api/client'
import { photoTurnFailure } from './afiPhotoTurnError'

describe('photoTurnFailure', () => {
  it('keeps the normal pose and the server sentence when the daily quota is spent', () => {
    const failure = photoTurnFailure(
      new ApiError(429, 'bugünlük fotoğraf hakkın doldu; yarın yine deneyebilirsin'),
    )
    expect(failure.offline).toBe(false)
    expect(failure.text).toContain('bugünlük fotoğraf hakkın doldu')
  })

  it('falls back to its own sentence when a 429 carries no body', () => {
    const failure = photoTurnFailure(new ApiError(429, 'HTTP 429'))
    expect(failure.offline).toBe(false)
    expect(failure.text).toContain('Bugünlük fotoğraf hakkın doldu')
  })

  it('asks for a smaller frame when the photo is too large', () => {
    const failure = photoTurnFailure(new ApiError(413, 'fotoğraf çok büyük'))
    expect(failure.offline).toBe(false)
    expect(failure.text).toContain('çok büyük')
  })

  it('carries the offline pose when the provider fails', () => {
    const failure = photoTurnFailure(new ApiError(502, 'Afi şu an bakamıyor'))
    expect(failure.offline).toBe(true)
  })

  it('carries the offline pose on timeout and on unknown errors', () => {
    expect(photoTurnFailure(new ApiRequestTimeoutError(28_000)).offline).toBe(true)
    expect(photoTurnFailure(new Error('boom')).offline).toBe(true)
  })
})
