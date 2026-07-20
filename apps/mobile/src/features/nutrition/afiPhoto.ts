import { FOOD_GROUPS, FOOD_MEASURES, type FoodGroup, type FoodMeasure, type Macros } from '@afiet/core'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import { AFI_PHOTO_COMPRESSION, afiPhotoResize } from './afiPhotoImage'
import type { PhotoSource } from './afiPhotoPermission'
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

/** Camera and library inputs share the same resized upload representation. */
export interface PickedImage {
  uri: string
  base64: string
}

export type PhotoPickResult =
  | { kind: 'picked'; image: PickedImage }
  | { kind: 'cancelled' }
  | { kind: 'permission-denied'; source: PhotoSource; canAskAgain: boolean }
  | { kind: 'error'; source: PhotoSource }

async function firstAsset(
  result: ImagePicker.ImagePickerResult,
  source: PhotoSource,
): Promise<PhotoPickResult> {
  if (result.canceled) return { kind: 'cancelled' }
  const asset = result.assets?.[0]
  if (!asset?.uri) return { kind: 'error', source }

  const context = ImageManipulator.manipulate(asset.uri)
  const resize = afiPhotoResize(asset.width, asset.height)
  if (resize) context.resize(resize)
  const rendered = await context.renderAsync()
  const processed = await rendered.saveAsync({
    base64: true,
    compress: AFI_PHOTO_COMPRESSION,
    format: SaveFormat.JPEG,
  })
  if (!processed.base64) return { kind: 'error', source }
  return { kind: 'picked', image: { uri: processed.uri, base64: processed.base64 } }
}

/** Captures and prepares a camera image with an explicit permission outcome. */
export async function pickFromCamera(): Promise<PhotoPickResult> {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      return { kind: 'permission-denied', source: 'camera', canAskAgain: perm.canAskAgain }
    }
    return await firstAsset(await ImagePicker.launchCameraAsync(), 'camera')
  } catch {
    return { kind: 'error', source: 'camera' }
  }
}

/** Selects and prepares a library image with an explicit permission outcome. */
export async function pickFromLibrary(): Promise<PhotoPickResult> {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      return { kind: 'permission-denied', source: 'library', canAskAgain: perm.canAskAgain }
    }
    return await firstAsset(
      await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] }),
      'library',
    )
  } catch {
    return { kind: 'error', source: 'library' }
  }
}

/** Bir sohbet turu: fotoğraf ve/veya metin gönder, Afi'nin cevabını al. */
export async function photoTurn(
  input: {
    conversationId: string | null
    text?: string
    imageBase64?: string
    /** Yalnız ilk turda: Besin Ekle'de yazılmış ad. */
    hint?: string
  },
  signal?: AbortSignal,
): Promise<AfiPhotoTurn> {
  const r = await requireApi().afiPhotoChat(
    {
      conversationId: input.conversationId ?? undefined,
      text: input.text,
      imageBase64: input.imageBase64,
      hint: input.conversationId ? undefined : input.hint,
    },
    signal,
  )
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
