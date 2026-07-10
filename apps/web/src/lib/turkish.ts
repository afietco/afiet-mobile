/**
 * tr-TR küçük harf dönüşümü — İ→i, I→ı. `toLocaleLowerCase('tr-TR')` ile eşdeğer,
 * ancak ICU/Intl gerektirmez: React Native (Hermes) dahil her ortamda aynı sonucu verir.
 */
export const turkishLower = (s: string) =>
  s.replaceAll('İ', 'i').replaceAll('I', 'ı').toLowerCase()
