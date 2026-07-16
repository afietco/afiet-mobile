import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import type { ApiRhythmWeek } from '@/data/api/client'

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
}

export const WIDGET_STATE_KEY = 'fh:widgetState'

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
export async function syncWidget(week: ApiRhythmWeek, today: string): Promise<void> {
  const state: WidgetState = {
    dots: week.days.map((d) => (d.afiyet ? 1 : 0)),
    done: week.done,
    goal: week.goal,
    todayIndex: Math.max(
      0,
      week.days.findIndex((d) => d.date === today),
    ),
  }
  const raw = JSON.stringify(state)
  try {
    await AsyncStorage.setItem(WIDGET_STATE_KEY, raw)
    if (Platform.OS === 'ios') {
      // App Group UserDefaults + timeline tazeleme (@bacons/apple-targets)
      const { ExtensionStorage } = await import('@bacons/apple-targets')
      const storage = new ExtensionStorage('group.co.afiet.app')
      storage.set('widgetState', raw)
      ExtensionStorage.reloadWidget()
    } else {
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
  } catch {
    // Widget kurulmamış ya da native modül yok (Expo Go): sessiz geç
  }
}
