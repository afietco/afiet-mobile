/**
 * The four font files, keyed by the family names the app asks for.
 *
 * Only used where nothing is embedded (Expo Go, web preview). Kept in its own
 * module so the loading path is one import that a native build never reaches
 * at runtime, and so the file paths live next to nothing else.
 */
import { fontFamilies } from './fonts'

export const runtimeFonts = {
  [fontFamilies.normal]: require('@expo-google-fonts/nunito/400Regular/Nunito_400Regular.ttf'),
  [fontFamilies.semibold]: require('@expo-google-fonts/nunito/600SemiBold/Nunito_600SemiBold.ttf'),
  [fontFamilies.bold]: require('@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf'),
  [fontFamilies.extrabold]: require('@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf'),
}
