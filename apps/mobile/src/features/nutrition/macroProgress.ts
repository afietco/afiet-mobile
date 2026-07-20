export function hasProgressTarget(max: number): boolean {
  return Number.isFinite(max) && max > 0
}

export function progressPercent(value: number, max: number): number {
  if (!hasProgressTarget(max) || !Number.isFinite(value) || value <= 0) return 0
  return Math.min(100, (value / max) * 100)
}
