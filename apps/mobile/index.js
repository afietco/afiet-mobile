// Uygulama girişi: Android widget görev işleyicisi expo-router'dan ÖNCE
// kaydedilir (headless widget çizimleri uygulama açılmadan da çalışır).
import { registerWidgetTaskHandler } from 'react-native-android-widget'
import { widgetTaskHandler } from './src/features/widget/widgetTaskHandler'

registerWidgetTaskHandler(widgetTaskHandler)

// eslint-disable-next-line import/first
import 'expo-router/entry'
