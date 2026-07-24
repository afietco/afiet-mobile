import { requireApi } from '@/data/api/apiHolder'
import type { ApiQuest } from '@/data/api/client'
import { notify } from '@/data/live'
import { useLive, type LiveQueryResult } from '@/data/useLive'

/**
 * Görevler (Tur 2, afiet-gamification/docs/12).
 *
 * İstemci sayaç TUTMAZ: ilerleme sunucuda mevcut veriden türetilir, burada
 * yalnız okunur. Görev listesi, ilerlemeyi besleyen davranışların canlı sorgu
 * anahtarlarına bağlıdır; öğün eklenince liste ek bir istek beklemeden tazelenir.
 */

const QUEST_TABLES = ['meals', 'water', 'measurements', 'customFoods', 'profiles'] as const

export function useQuestsResult(): LiveQueryResult<ApiQuest[]> {
  return useLive([...QUEST_TABLES], () => requireApi().getQuests(), [])
}

/**
 * Görevi alır. Ödül tecrübe yazdığı için ilerleme ve seviye de tazelenmeli;
 * notify aynı anahtarları tetikleyerek hem görev listesini hem seviye halkasını
 * günceller.
 */
export async function claimQuest(key: string): Promise<ApiQuest> {
  const quest = await requireApi().claimQuest(key)
  notify('meals', 'water', 'measurements', 'customFoods', 'profiles')
  return quest
}

export interface QuestSections {
  /** Tamamlanmış, henüz alınmamış: Bugün'deki kartı ilgi çekici yapan set. */
  claimable: ApiQuest[]
  /** Sürüyor; her metrik grubundan YALNIZ en yakın eşik. */
  active: ApiQuest[]
  /** Alınmış görevler; biriken kimlik listesi. */
  claimed: ApiQuest[]
}

/**
 * Görünürlük kuralı (docs/12): tüm eşikleri aynı anda göstermek ekranı bir
 * kontrol listesine çevirir ve baskı kurar. Bu yüzden sürmekte olanlardan her
 * metrik grubunun yalnız EN YAKIN eşiği gösterilir; 7 afiyet günü tamamlanınca
 * 30 belirir.
 */
export function questSections(quests: ApiQuest[]): QuestSections {
  const claimable: ApiQuest[] = []
  const claimed: ApiQuest[] = []
  const nearestByGroup = new Map<string, ApiQuest>()

  for (const quest of quests) {
    if (quest.claimed) {
      claimed.push(quest)
      continue
    }
    if (quest.completed) {
      claimable.push(quest)
      continue
    }
    const current = nearestByGroup.get(quest.group)
    if (!current || quest.target < current.target) nearestByGroup.set(quest.group, quest)
  }

  // Yakınlık sırası: hedefine en çok yaklaşmış grup önce görünür.
  const active = [...nearestByGroup.values()].sort((a, b) => {
    const remainingA = a.target - a.progress
    const remainingB = b.target - b.progress
    return remainingA !== remainingB ? remainingA - remainingB : a.target - b.target
  })

  return { claimable, active, claimed }
}
