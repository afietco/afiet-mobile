import { FOOD_GROUPS, FOOD_MEASURES, type FoodGroup, type FoodMeasure, type Macros } from '@afiet/core'
import * as ImagePicker from 'expo-image-picker'
import { requireApi } from '@/data/api/apiHolder'
import type { ApiAfiPhotoFood } from '@/data/api/client'

/**
 * Afi asistanı, fotoğraftan besin tanıma (B dilimi): POST /v1/afi/photo-chat
 * üzerinde ince istemci. Fotoğraf sunucuda SAKLANMAZ; çok turlu bağlam
 * Foundry conversation'ında yaşar. İlk turda Besin Ekle'de yazılmış ad
 * hint olarak gider (ajan referans alır, fotoğrafla çelişirse fotoğrafa
 * güvenir). Ajan karede ek besinler görürse extraFoods ile bildirir.
 *
 * Sohbet serbest değil, süreç odaklıdır. Kurallar (afi-asistan.md): sonuç
 * her zaman DÜZENLENEBİLİR taslaktır, dil "yaklaşık", yargı yok.
 */

export interface AfiPhotoFood {
  name: string
  groups: FoodGroup[]
  measure: FoodMeasure
  macros: Macros
  description?: string
  /** Katalogda ya da menüde aynı adla besin var mı (teklif buna göre). */
  inPool: boolean
}

export interface AfiPhotoReply {
  kind: 'question' | 'result' | 'not_food'
  text: string
  quickReplies: string[]
  needsPhoto?: boolean
  food?: AfiPhotoFood
  /** Karede görülen ek besinler (en fazla 3). */
  extraFoods: AfiPhotoFood[]
}

export interface AfiPhotoTurn {
  conversationId: string
  reply: AfiPhotoReply
}

const GROUP_KEYS = new Set<string>(FOOD_GROUPS.map((g) => g.key))
const MEASURE_KEYS = new Set<string>(FOOD_MEASURES.map((m) => m.key))

// Sunucu zaten süzer; tip sınırında bir kez daha doğrula ki sözleşme
// kayarsa UI'a geçersiz anahtar sızmasın.
function toFood(f: ApiAfiPhotoFood): AfiPhotoFood {
  return {
    name: f.name,
    groups: f.groups.filter((g): g is FoodGroup => GROUP_KEYS.has(g)),
    measure: MEASURE_KEYS.has(f.measure) ? (f.measure as FoodMeasure) : 'porsiyon',
    macros: {
      kcal: Math.max(0, Math.round(f.macros.kcal)),
      protein: Math.max(0, Math.round(f.macros.protein)),
      carb: Math.max(0, Math.round(f.macros.carb)),
      fat: Math.max(0, Math.round(f.macros.fat)),
    },
    description: f.description?.trim() || undefined,
    inPool: f.inPool,
  }
}

/**
 * Fotoğraf giriş noktaları (kamera + galeri) tek yerde. Afi'nin foto tanıma
 * akışının kullanıldığı her ekran bunları paylaşır; her ikisi de küçük base64
 * (quality 0.4) döndürür, vazgeçme/izin yok/hata durumunda sessizce null.
 */
export interface PickedImage {
  uri: string
  base64: string
}

const PICK_OPTS = { quality: 0.4, base64: true } as const

function firstAsset(result: ImagePicker.ImagePickerResult): PickedImage | null {
  if (result.canceled) return null
  const asset = result.assets?.[0]
  if (!asset?.base64) return null
  return { uri: asset.uri, base64: asset.base64 }
}

/** Kameradan bir kare al. İzin verilmezse ya da kamerasız ortamda null. */
export async function pickFromCamera(): Promise<PickedImage | null> {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) return null
    return firstAsset(await ImagePicker.launchCameraAsync(PICK_OPTS))
  } catch {
    return null
  }
}

/** Galeriden bir görsel seç. Vazgeçilirse ya da erişilemezse null. */
export async function pickFromLibrary(): Promise<PickedImage | null> {
  try {
    return firstAsset(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], ...PICK_OPTS }))
  } catch {
    return null
  }
}

/** Bir sohbet turu: fotoğraf ve/veya metin gönder, Afi'nin cevabını al. */
export async function photoTurn(input: {
  conversationId: string | null
  text?: string
  imageBase64?: string
  /** Yalnız ilk turda: Besin Ekle'de yazılmış ad. */
  hint?: string
}): Promise<AfiPhotoTurn> {
  const r = await requireApi().afiPhotoChat({
    conversationId: input.conversationId ?? undefined,
    text: input.text,
    imageBase64: input.imageBase64,
    hint: input.conversationId ? undefined : input.hint,
  })
  return {
    conversationId: r.conversationId,
    reply: {
      kind: r.kind,
      text: r.text,
      quickReplies: r.quickReplies ?? [],
      needsPhoto: r.needsPhoto,
      food: r.food ? toFood(r.food) : undefined,
      extraFoods: (r.extraFoods ?? []).map(toFood),
    },
  }
}
