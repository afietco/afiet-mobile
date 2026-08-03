/**
 * Nunito, and where each build gets it from.
 *
 * React Native has no variable fonts, so every weight is its own family. The
 * names below are the fonts' own PostScript names, and that is not cosmetic:
 * iOS resolves `fontFamily` against the PostScript name recorded inside the
 * file, and the expo-font config plugin takes the iOS family name from the
 * file for exactly that reason. Using anything else here would work on Android
 * and silently fall back to the system font on iOS.
 *
 * The same four names are declared for Android in the plugin config and
 * registered under the same keys by the runtime loader, so one string works in
 * every environment.
 *
 * Where the files come from:
 *
 *  - Native builds embed them at build time (app.json → expo-font). Nothing is
 *    loaded at runtime, so the splash never waits on a font.
 *  - Expo Go cannot have anything embedded (it is a prebuilt binary) and the
 *    web preview has no native layer at all. Both load the same four files
 *    from the npm package on startup, exactly as the whole app used to.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants'
import { Platform } from 'react-native'

export const fontFamilies = {
  normal: 'Nunito-Regular',
  semibold: 'Nunito-SemiBold',
  bold: 'Nunito-Bold',
  extrabold: 'Nunito-ExtraBold',
} as const

export type FontWeightName = keyof typeof fontFamilies

/** True where the fonts are not compiled in and have to be fetched on startup. */
export const needsRuntimeFonts =
  Platform.OS === 'web' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient
