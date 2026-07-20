/**
 * Turkish lowercase conversion: İ→i and I→ı. Equivalent to
 * `toLocaleLowerCase('tr-TR')` without requiring ICU/Intl support.
 */
export const turkishLower = (s: string) =>
  s.replaceAll('İ', 'i').replaceAll('I', 'ı').toLowerCase()

/**
 * Turkish uppercase conversion: i→İ and ı→I. Equivalent to
 * `toLocaleUpperCase('tr-TR')` without requiring ICU/Intl support.
 */
export const turkishUpper = (s: string) =>
  s.replaceAll('i', 'İ').replaceAll('ı', 'I').toUpperCase()
