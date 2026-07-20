/**
 * Parses RFC 3339 timestamps and PostgreSQL timestamptz text values such as
 * `2026-07-20 21:04:43.258593+00`, which Hermes does not parse consistently.
 */
export function parseApiTimestampMs(value: string): number {
  const direct = Date.parse(value)
  if (Number.isFinite(direct)) return direct

  const normalized = value
    .replace(/^(\d{4}-\d{2}-\d{2}) /, '$1T')
    .replace(/\.(\d{3})\d+/, '.$1')
    .replace(/([+-]\d{2})$/, '$1:00')

  return Date.parse(normalized)
}
