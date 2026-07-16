import type { FoodGroup, FoodMeasure, Macros } from '@afiet/core'

/**
 * Afi asistanı, fotoğraftan besin tanıma (B dilimi): MOCK katman.
 * UI onaylanınca backend'e bağlanacak: POST /v1/afi/photo-chat
 * {conversationId?, text?, imageBase64?} — çok turlu bağlam Foundry
 * conversations ile sunucuda tutulur, fotoğraf SAKLANMAZ (karar: 16 Tem).
 *
 * Sohbet serbest değil, süreç odaklıdır: her Afi cevabı ya net bir soru
 * (quickReplies çipleri, gerekirse ek fotoğraf isteği) ya da sonuç
 * kartıdır. Kurallar (afi-asistan.md): sonuç her zaman DÜZENLENEBİLİR
 * taslaktır, dil "yaklaşık", yargı yok.
 */

export interface AfiPhotoFood {
  name: string
  groups: FoodGroup[]
  measure: FoodMeasure
  macros: Macros
  description?: string
}

export interface AfiPhotoReply {
  kind: 'question' | 'result' | 'not_food'
  /** Afi'nin balon metni. */
  text: string
  /** Soru turunda kapalı uçlu cevap çipleri. */
  quickReplies: string[]
  /** true → çipler arasında "yakından çek" var, kamera yeniden açılabilir. */
  needsPhoto?: boolean
  /** kind=result iken dolu. */
  food?: AfiPhotoFood
  /** Besin havuzda (katalog ya da menü) var mı — teklif metni buna göre. */
  inPool?: boolean
}

export interface AfiPhotoTurn {
  conversationId: string
  reply: AfiPhotoReply
}

// MOCK durum: conversationId → kaç tur geçti. Backend gelince kalkacak.
const mockTurns = new Map<string, number>()

const RESULT_ETLI: AfiPhotoFood = {
  name: 'Etli güveç',
  groups: ['protein', 'sebze'],
  measure: 'porsiyon',
  macros: { kcal: 340, protein: 22, carb: 18, fat: 19 },
  description: 'Fotoğraftan tahmin; ev usulü tarife göre yaklaşık değerler.',
}

const RESULT_SEBZELI: AfiPhotoFood = {
  name: 'Sebzeli güveç',
  groups: ['sebze', 'yag'],
  measure: 'porsiyon',
  macros: { kcal: 210, protein: 6, carb: 24, fat: 10 },
  description: 'Fotoğraftan tahmin; zeytinyağlı tarife göre yaklaşık değerler.',
}

/** Bir sohbet turu: fotoğraf ve/veya metin gönder, Afi'nin cevabını al. */
export async function photoTurn(input: {
  conversationId: string | null
  text?: string
  imageBase64?: string
}): Promise<AfiPhotoTurn> {
  await new Promise((r) => setTimeout(r, 1300))
  const id = input.conversationId ?? `mock-${String(Date.now())}`
  const turn = (mockTurns.get(id) ?? 0) + 1
  mockTurns.set(id, turn)

  // MOCK senaryo: ilk fotoğraf → netleştirme sorusu; cevap ya da ikinci
  // fotoğraf → sonuç. "çorba" yazılırsa havuzda-var yolu gösterilir.
  if (input.text && input.text.toLocaleLowerCase('tr').includes('çorba')) {
    return {
      conversationId: id,
      reply: {
        kind: 'result',
        text: 'Buldum: bu bir mercimek çorbası 🧡 Zaten besin listende var; istersen hemen öğününe yazayım.',
        quickReplies: [],
        food: {
          name: 'Mercimek Çorbası',
          groups: ['bakliyat', 'sebze'],
          measure: 'kase',
          macros: { kcal: 165, protein: 9, carb: 24, fat: 4 },
          description: 'Ev usulü 1 kase için yaklaşık değerler.',
        },
        inPool: true,
      },
    }
  }
  if (turn === 1 && input.imageBase64) {
    return {
      conversationId: id,
      reply: {
        kind: 'question',
        text: 'Bir güveç görüyorum ama emin olamadım: içinde et var mı, yoksa sebze ağırlıklı mı? 🤔',
        quickReplies: ['Etli', 'Sebzeli', 'Yakından çek'],
        needsPhoto: true,
      },
    }
  }
  if (turn === 1) {
    return {
      conversationId: id,
      reply: {
        kind: 'not_food',
        text: 'Bu karede bir yemek seçemedim 😅 Tabağı biraz daha yakından ve ışıklı çeker misin?',
        quickReplies: ['Tekrar çek'],
        needsPhoto: true,
      },
    }
  }

  const sebzeli = input.text?.toLocaleLowerCase('tr').includes('sebze') ?? false
  const food = sebzeli ? RESULT_SEBZELI : RESULT_ETLI
  return {
    conversationId: id,
    reply: {
      kind: 'result',
      text: `Buldum: ${food.name.toLocaleLowerCase('tr')} 🧡 Menünde henüz yok; istersen ekleyip bugünkü öğününe de yazayım.`,
      quickReplies: [],
      food,
      inPool: false,
    },
  }
}
