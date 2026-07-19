/**
 * Turkish lowercase conversion: İ→i and I→ı. Equivalent to
 * `toLocaleLowerCase('tr-TR')` without requiring ICU/Intl support.
 */
export const turkishLower = (s: string) =>
  s.replaceAll('İ', 'i').replaceAll('I', 'ı').toLowerCase()
