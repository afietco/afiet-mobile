import AsyncStorage from '@react-native-async-storage/async-storage'
import type { WidgetTaskHandlerProps } from 'react-native-android-widget'
import { RitimWidgetAndroid, type RitimWidgetState } from './RitimWidgetAndroid'
import { WIDGET_STATE_KEY, widgetMeal } from './widgetBridge'
import { widgetWeekStart } from './widgetFreshness'

/**
 * Android widget görev işleyicisi: sistem widget'ı eklediğinde/güncelleme
 * istediğinde headless JS burada çizer. Durum AsyncStorage köprüsünden
 * okunur; veri yoksa boş hafta gösterilir (davet hâlâ anlamlı).
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const now = new Date()
  const fallback: RitimWidgetState = {
    weekStart: widgetWeekStart(now),
    savedAt: now.toISOString(),
    dots: [0, 0, 0, 0, 0, 0, 0],
    done: 0,
    goal: 5,
    todayIndex: (now.getDay() + 6) % 7,
  }
  let state = fallback
  try {
    const raw = await AsyncStorage.getItem(WIDGET_STATE_KEY)
    if (raw) state = JSON.parse(raw) as RitimWidgetState
  } catch {
    // köprü yoksa boş hafta
  }
  const meal = widgetMeal()

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      props.renderWidget(
        <RitimWidgetAndroid state={state} mealKey={meal.key} mealLabel={meal.label} />,
      )
      break
    default:
      break
  }
}
