import type { FoodGroup } from './types'

export interface SeedFood {
  name: string
  groups: FoodGroup[]
}

/**
 * Otomatik tamamlama için yaygın Türk yemekleri / besinler.
 * Gruplar varsayılandır, kullanıcı eklerken düzenleyebilir.
 */
export const SEED_FOODS: SeedFood[] = [
  // Kahvaltılık
  { name: 'Beyaz peynir', groups: ['sut', 'protein'] },
  { name: 'Kaşar peyniri', groups: ['sut', 'protein'] },
  { name: 'Lor peyniri', groups: ['sut', 'protein'] },
  { name: 'Haşlanmış yumurta', groups: ['protein'] },
  { name: 'Menemen', groups: ['protein', 'sebze'] },
  { name: 'Sahanda yumurta', groups: ['protein'] },
  { name: 'Omlet', groups: ['protein'] },
  { name: 'Zeytin', groups: ['yag'] },
  { name: 'Bal', groups: ['tatli'] },
  { name: 'Reçel', groups: ['tatli'] },
  { name: 'Tahin pekmez', groups: ['yag', 'tatli'] },
  { name: 'Tereyağı', groups: ['yag'] },
  { name: 'Simit', groups: ['tahil'] },
  { name: 'Poğaça', groups: ['tahil', 'yag'] },
  { name: 'Börek', groups: ['tahil', 'yag'] },
  { name: 'Tam buğday ekmek', groups: ['tahil'] },
  { name: 'Beyaz ekmek', groups: ['tahil'] },
  { name: 'Bazlama', groups: ['tahil'] },
  { name: 'Yulaf ezmesi', groups: ['tahil'] },
  { name: 'Granola', groups: ['tahil'] },
  // Çorbalar
  { name: 'Mercimek çorbası', groups: ['protein', 'sebze'] },
  { name: 'Ezogelin çorbası', groups: ['protein', 'tahil'] },
  { name: 'Tarhana çorbası', groups: ['tahil', 'sut'] },
  { name: 'Yayla çorbası', groups: ['sut', 'tahil'] },
  { name: 'Domates çorbası', groups: ['sebze'] },
  { name: 'Tavuk suyu çorba', groups: ['protein'] },
  // Ana yemekler
  { name: 'Izgara tavuk', groups: ['protein'] },
  { name: 'Tavuk sote', groups: ['protein', 'sebze'] },
  { name: 'Izgara köfte', groups: ['protein'] },
  { name: 'Izgara balık', groups: ['protein', 'yag'] },
  { name: 'Somon', groups: ['protein', 'yag'] },
  { name: 'Et sote', groups: ['protein'] },
  { name: 'Karnıyarık', groups: ['sebze', 'protein'] },
  { name: 'İmam bayıldı', groups: ['sebze', 'yag'] },
  { name: 'Kuru fasulye', groups: ['protein', 'sebze'] },
  { name: 'Nohut yemeği', groups: ['protein', 'sebze'] },
  { name: 'Yeşil mercimek yemeği', groups: ['protein', 'sebze'] },
  { name: 'Barbunya pilaki', groups: ['protein', 'sebze'] },
  { name: 'Türlü', groups: ['sebze'] },
  { name: 'Kabak yemeği', groups: ['sebze'] },
  { name: 'Ispanak yemeği', groups: ['sebze'] },
  { name: 'Taze fasulye', groups: ['sebze'] },
  { name: 'Bamya', groups: ['sebze'] },
  { name: 'Dolma', groups: ['sebze', 'tahil'] },
  { name: 'Sarma', groups: ['sebze', 'tahil'] },
  { name: 'Mantı', groups: ['tahil', 'protein', 'sut'] },
  { name: 'Karnabahar graten', groups: ['sebze', 'sut'] },
  // Yan / karbonhidrat
  { name: 'Pirinç pilavı', groups: ['tahil'] },
  { name: 'Bulgur pilavı', groups: ['tahil'] },
  { name: 'Makarna', groups: ['tahil'] },
  { name: 'Patates haşlama', groups: ['sebze'] },
  { name: 'Fırın patates', groups: ['sebze'] },
  { name: 'Kumpir', groups: ['sebze', 'sut'] },
  // Salata & yoğurt
  { name: 'Çoban salata', groups: ['sebze'] },
  { name: 'Mevsim salata', groups: ['sebze'] },
  { name: 'Roka salatası', groups: ['sebze'] },
  { name: 'Ton balıklı salata', groups: ['sebze', 'protein'] },
  { name: 'Tavuklu salata', groups: ['sebze', 'protein'] },
  { name: 'Yoğurt', groups: ['sut'] },
  { name: 'Cacık', groups: ['sut', 'sebze'] },
  { name: 'Ayran', groups: ['sut'] },
  { name: 'Kefir', groups: ['sut'] },
  { name: 'Süt', groups: ['sut'] },
  // Meyve & kuruyemiş
  { name: 'Elma', groups: ['meyve'] },
  { name: 'Muz', groups: ['meyve'] },
  { name: 'Portakal', groups: ['meyve'] },
  { name: 'Mandalina', groups: ['meyve'] },
  { name: 'Üzüm', groups: ['meyve'] },
  { name: 'Karpuz', groups: ['meyve'] },
  { name: 'Kavun', groups: ['meyve'] },
  { name: 'Çilek', groups: ['meyve'] },
  { name: 'Kiraz', groups: ['meyve'] },
  { name: 'Şeftali', groups: ['meyve'] },
  { name: 'Armut', groups: ['meyve'] },
  { name: 'Nar', groups: ['meyve'] },
  { name: 'Kuru kayısı', groups: ['meyve'] },
  { name: 'Hurma', groups: ['meyve'] },
  { name: 'Ceviz', groups: ['yag', 'protein'] },
  { name: 'Badem', groups: ['yag', 'protein'] },
  { name: 'Fındık', groups: ['yag', 'protein'] },
  { name: 'Leblebi', groups: ['protein'] },
  // Fast food & atıştırmalık
  { name: 'Döner', groups: ['protein', 'tahil', 'fastfood'] },
  { name: 'Lahmacun', groups: ['tahil', 'protein', 'fastfood'] },
  { name: 'Pide', groups: ['tahil', 'protein', 'fastfood'] },
  { name: 'Hamburger', groups: ['fastfood', 'protein', 'tahil'] },
  { name: 'Pizza', groups: ['fastfood', 'tahil', 'sut'] },
  { name: 'Patates kızartması', groups: ['fastfood'] },
  { name: 'Tost', groups: ['tahil', 'sut'] },
  { name: 'Cips', groups: ['fastfood'] },
  { name: 'Çikolata', groups: ['tatli'] },
  { name: 'Gofret', groups: ['tatli'] },
  { name: 'Bisküvi', groups: ['tatli', 'tahil'] },
  { name: 'Kek', groups: ['tatli', 'tahil'] },
  { name: 'Kurabiye', groups: ['tatli', 'tahil'] },
  // Tatlılar
  { name: 'Baklava', groups: ['tatli'] },
  { name: 'Sütlaç', groups: ['tatli', 'sut'] },
  { name: 'Künefe', groups: ['tatli', 'sut'] },
  { name: 'Kazandibi', groups: ['tatli', 'sut'] },
  { name: 'Dondurma', groups: ['tatli', 'sut'] },
  { name: 'Revani', groups: ['tatli'] },
  { name: 'Lokma', groups: ['tatli'] },
  // İçecekler
  { name: 'Çay', groups: [] },
  { name: 'Türk kahvesi', groups: [] },
  { name: 'Filtre kahve', groups: [] },
  { name: 'Taze sıkılmış portakal suyu', groups: ['meyve'] },
  { name: 'Kola', groups: ['tatli'] },
  { name: 'Gazoz', groups: ['tatli'] },
  { name: 'Meyve suyu (hazır)', groups: ['tatli'] },
  { name: 'Smoothie', groups: ['meyve'] },
]

const trLower = (s: string) => s.toLocaleLowerCase('tr-TR')

export function searchSeedFoods(query: string, limit = 6): SeedFood[] {
  const q = trLower(query.trim())
  if (!q) return []
  const starts = SEED_FOODS.filter((f) => trLower(f.name).startsWith(q))
  const includes = SEED_FOODS.filter(
    (f) => !trLower(f.name).startsWith(q) && trLower(f.name).includes(q),
  )
  return [...starts, ...includes].slice(0, limit)
}
