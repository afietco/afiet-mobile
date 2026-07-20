import { dayBalance } from '@afiet/core'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { mealRepo } from '../../data/repositories'
import type { ApiRhythmWeek } from '@/data/api/client'
import { resolveWidgetTodayIndex } from './widgetTodayIndex'

/**
 * Widget veri köprüsü: uygulama ritim haftasını her tazelediğinde küçük
 * bir durum anlık görüntüsü yazılır; widget'lar API çağırmaz, yalnız bunu
 * okur (iOS: App Group UserDefaults · Android: AsyncStorage + yeniden
 * çizim isteği). Veri "son açılış kadar taze"dir — ritim için yeterli.
 */

export interface WidgetState {
  dots: number[]
  done: number
  goal: number
  todayIndex: number
  /** Bugün kapsanan çekirdek gruplar (orta boyun denge satırı). */
  covered: string[]
}

export const WIDGET_STATE_KEY = 'fh:widgetState'

let storeGeneration = 0
let writeQueue: Promise<void> = Promise.resolve()

function enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
  const run = writeQueue.catch(() => undefined).then(operation)
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function emptyWidgetState(now = new Date()): WidgetState {
  return {
    dots: [0, 0, 0, 0, 0, 0, 0],
    done: 0,
    goal: 5,
    todayIndex: (now.getDay() + 6) % 7,
    covered: [],
  }
}

async function persistWidgetState(state: WidgetState): Promise<void> {
  const raw = JSON.stringify(state)
  await AsyncStorage.setItem(WIDGET_STATE_KEY, raw)
  if (Platform.OS === 'ios') {
    const { ExtensionStorage } = await import('@bacons/apple-targets')
    const storage = new ExtensionStorage('group.co.afiet.app')
    storage.set('widgetState', raw)
    ExtensionStorage.reloadWidget()
    return
  }
  if (Platform.OS === 'android') {
    const { requestWidgetUpdate } = await import('react-native-android-widget')
    const { RitimWidgetAndroid } = await import('./RitimWidgetAndroid')
    const meal = widgetMeal()
    await requestWidgetUpdate({
      widgetName: 'AfiyetRitmi',
      renderWidget: () => (
        <RitimWidgetAndroid state={state} mealKey={meal.key} mealLabel={meal.label} />
      ),
    })
  }
}

/** Saat → öğün; guessMealByTime ile aynı eşleme (widget CTA'sı için). */
export function widgetMeal(now = new Date()): { key: string; label: string } {
  const h = now.getHours()
  if (h >= 5 && h < 11) return { key: 'kahvalti', label: 'Kahvaltıyı ekle' }
  if (h >= 11 && h < 15) return { key: 'ogle', label: 'Öğleyi ekle' }
  if (h >= 15 && h < 17) return { key: 'ara', label: 'Ara öğün ekle' }
  if (h >= 17 && h < 22) return { key: 'aksam', label: 'Akşamı ekle' }
  return { key: 'ara', label: 'Ara öğün ekle' }
}

/** Ritim haftasından widget durumunu türetip her iki platforma yazar. */
export async function syncWidget(
  profileId: number,
  week: ApiRhythmWeek,
  today: string,
): Promise<void> {
  const generation = storeGeneration
  let covered: string[] = []
  try {
    const entries = await mealRepo.forDay(profileId, today)
    covered = dayBalance(entries).covered
  } catch {
    // denge okunamadıysa satır solgun kalır
  }
  if (generation !== storeGeneration) return
  const state: WidgetState = {
    dots: week.days.map((d) => (d.afiyet ? 1 : 0)),
    done: week.done,
    goal: week.goal,
    todayIndex: resolveWidgetTodayIndex(week.days, today),
    covered,
  }
  await enqueueWrite(async () => {
    if (generation !== storeGeneration) return
    try {
      await persistWidgetState(state)
    } catch {
      // Widget installation and native modules are optional at runtime.
    }
  })
}

async function resetNativeWidget(state: WidgetState): Promise<void> {
  if (Platform.OS === 'ios') {
    const { ExtensionStorage } = await import('@bacons/apple-targets')
    const storage = new ExtensionStorage('group.co.afiet.app')
    storage.remove('widgetState')
    ExtensionStorage.reloadWidget()
    return
  }
  if (Platform.OS === 'android') {
    const { requestWidgetUpdate } = await import('react-native-android-widget')
    const { RitimWidgetAndroid } = await import('./RitimWidgetAndroid')
    const meal = widgetMeal()
    await requestWidgetUpdate({
      widgetName: 'AfiyetRitmi',
      renderWidget: () => (
        <RitimWidgetAndroid state={state} mealKey={meal.key} mealLabel={meal.label} />
      ),
    })
  }
}

/** Removes health data from shared storage and redraws installed widgets empty. */
export async function resetWidgetState(): Promise<void> {
  storeGeneration += 1
  const state = emptyWidgetState()
  await enqueueWrite(async () => {
    const results = await Promise.allSettled([
      AsyncStorage.removeItem(WIDGET_STATE_KEY),
      resetNativeWidget(state),
    ])
    const failure = results.find((result) => result.status === 'rejected')
    if (failure?.status === 'rejected') throw failure.reason
  })
}
