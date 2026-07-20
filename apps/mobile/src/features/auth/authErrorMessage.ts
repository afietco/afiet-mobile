const NETWORK_ERROR_MESSAGE =
  'Şu anda bağlantı kuramadık. Birazdan tekrar deneyebilirsin.'
const GENERIC_ERROR_MESSAGE = 'Bir şeyler ters gitti.'

const NETWORK_MESSAGE_PATTERNS = [
  /network request failed/i,
  /failed to fetch/i,
  /fetch failed/i,
  /load failed/i,
  /networkerror/i,
  /internet connection appears to be offline/i,
  /connection (?:was )?(?:lost|timed out)/i,
  /request timed out/i,
]

function errorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null
  return typeof error.code === 'string' ? error.code.toUpperCase() : null
}

export function authErrorMessage(error: unknown): string {
  const code = errorCode(error)
  const message = error instanceof Error ? error.message.trim() : ''
  const networkFailure =
    code === 'ERR_NETWORK' ||
    code === 'NETWORK_ERROR' ||
    NETWORK_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))

  if (networkFailure) return NETWORK_ERROR_MESSAGE
  return message || GENERIC_ERROR_MESSAGE
}
