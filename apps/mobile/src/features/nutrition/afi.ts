import { FOOD_GROUPS, FOOD_MEASURES, type FoodGroup, type FoodMeasure, type Macros } from '@afiet/core'
import { requireApi } from '@/data/api/apiHolder'

/**
 * Afi asistanı, Menüm doldurma: POST /v1/afi/food-suggest üzerinde ince
 * istemci. LLM trafiği backend'den tek kapıdan çıkar (Azure AI Foundry),
 * istemci anahtar taşımaz; sunucu yapılandırılmamışsa aynı uç mock öneri
 * döner. Kurallar (afi-asistan.md): öneri her zaman DÜZENLENEBİLİRDİR,
 * kullanıcı onaylamadan kayda geçmez; dil hep "yaklaşık", yargı yok.
 */

export interface AfiFoodSuggestion {
  groups: FoodGroup[]
  measure: FoodMeasure
  /** 1 ölçü için yaklaşık değerler. */
  macros: Macros
  description?: string
}

const GROUP_KEYS = new Set<string>(FOOD_GROUPS.map((g) => g.key))
const MEASURE_KEYS = new Set<string>(FOOD_MEASURES.map((m) => m.key))

/** Yemeğin adından grup + ölçü + yaklaşık makro önerisi ister. */
export async function suggestFood(name: string): Promise<AfiFoodSuggestion> {
  const s = await requireApi().afiFoodSuggest(name)
  // Sunucu zaten süzer; yine de tip sınırında bir kez daha doğrula ki
  // sözleşme kayarsa UI'a geçersiz anahtar sızmasın.
  return {
    groups: s.groups.filter((g): g is FoodGroup => GROUP_KEYS.has(g)),
    measure: MEASURE_KEYS.has(s.measure) ? (s.measure as FoodMeasure) : 'porsiyon',
    macros: {
      kcal: Math.max(0, Math.round(s.macros.kcal)),
      protein: Math.max(0, Math.round(s.macros.protein)),
      carb: Math.max(0, Math.round(s.macros.carb)),
      fat: Math.max(0, Math.round(s.macros.fat)),
    },
    description: s.description?.trim() || undefined,
  }
}
