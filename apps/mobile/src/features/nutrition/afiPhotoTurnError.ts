import { ApiError, ApiRequestTimeoutError } from '../../data/api/client'

/**
 * What Afi says when a photo turn fails, and whether the bubble carries the
 * offline pose.
 *
 * `offline` means "Afi could not be reached". A spent daily quota or an
 * oversized photo are not that: Afi is fine and the user has something to do
 * about it, so those keep the normal pose and say what to do. Collapsing every
 * failure into the offline bubble made a spent quota look identical to a
 * provider outage.
 */
export interface PhotoTurnFailure {
  text: string
  offline: boolean
}

const UNREACHABLE = 'Şu an bağlanamadım; birazdan tekrar dener misin?'

export function photoTurnFailure(error: unknown): PhotoTurnFailure {
  if (error instanceof ApiRequestTimeoutError) {
    return {
      text: 'Fotoğrafa bakarken çok uzun sürdü; bağlantın yavaş olabilir. Bir daha dener misin?',
      offline: true,
    }
  }

  if (error instanceof ApiError) {
    switch (error.status) {
      case 429:
        // The server writes the user-facing sentence for quota; it knows the
        // window. Fall back only if the body was empty.
        return {
          text: serverText(error) ?? 'Bugünlük fotoğraf hakkın doldu; yarın yine deneyebiliriz.',
          offline: false,
        }
      case 413:
        return {
          text: 'Bu fotoğraf çok büyük geldi; biraz daha yakından tek kare çeker misin?',
          offline: false,
        }
      default:
        return { text: UNREACHABLE, offline: true }
    }
  }

  return { text: UNREACHABLE, offline: true }
}

/** The API client puts the server's `error.message` on ApiError when present. */
function serverText(error: ApiError): string | null {
  const message = error.message.trim()
  if (!message || /^HTTP \d+$/.test(message)) return null
  return message
}
