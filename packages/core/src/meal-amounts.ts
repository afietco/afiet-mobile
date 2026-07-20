import { formatDecimalTR } from './numbers'
import { measureMeta, type MealEntry } from './types'

/** Formats a saved meal amount with its localized measurement label. */
export function formatMealAmount(
  entry: Pick<MealEntry, 'quantity' | 'measure'>,
): string {
  return `${formatDecimalTR(entry.quantity)} ${measureMeta(entry.measure ?? 'porsiyon').label}`
}
