import type { FoodGroup, FoodMeasure, Macros } from '@afiet/core'

/**
 * Afi asistanı, Menüm doldurma: MOCK katman. UI onaylanınca backend'e
 * bağlanacak (POST /v1/afi/food-suggest; backend Azure AI Foundry'ye tek
 * kapıdan çıkar, istemci anahtar taşımaz). Arayüz bilerek dar tutuldu ki
 * geçiş UI'a dokunmasın.
 *
 * Kurallar (afi-asistan.md): öneri her zaman DÜZENLENEBİLİRDİR, kullanıcı
 * onaylamadan kayda geçmez; dil hep "yaklaşık", yargı yok.
 */

export interface AfiFoodSuggestion {
  groups: FoodGroup[]
  measure: FoodMeasure
  /** 1 ölçü için yaklaşık değerler. */
  macros: Macros
  description?: string
}

/** Yemeğin adından grup + ölçü + yaklaşık makro önerisi ister. */
export async function suggestFood(name: string): Promise<AfiFoodSuggestion> {
  // MOCK: sabit gecikme + ada göre kaba bir tahmin taklidi. Backend ucu
  // gelince bu gövde requireApi().afiFoodSuggest(name) olacak.
  await new Promise((r) => setTimeout(r, 1200))
  const lower = name.toLocaleLowerCase('tr')
  if (lower.includes('çorba')) {
    return {
      groups: ['sebze', 'protein'],
      measure: 'kase',
      macros: { kcal: 160, protein: 8, carb: 22, fat: 4 },
      description: 'Yaklaşık değerler ev usulü tarife göredir.',
    }
  }
  return {
    groups: ['tahil'],
    measure: 'porsiyon',
    macros: { kcal: 320, protein: 10, carb: 45, fat: 11 },
    description: 'Yaklaşık değerler; tarifine göre düzenleyebilirsin.',
  }
}
