import { Text, useWindowDimensions, type TextProps } from 'react-native'

/** RN'de değişken font yok; her kalınlık ayrı Nunito dosyası (root layout yükler) */
const FAMILIES = {
  normal: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
} as const

export type AppTextWeight = keyof typeof FAMILIES

/**
 * Nunito'lu Text; fontWeight yerine weight prop'u; className NativeWind'e geçer.
 *
 * It also drops the line height as soon as the person has scaled text up, and
 * that is the whole reason this component is not a one liner.
 *
 * The type scale in tailwind.config.js pins a line height in points next to
 * every size (`xs: ['13px', '18px']`). The platform scales `fontSize` and does
 * not scale `lineHeight`, so at the larger accessibility sizes forty point
 * glyphs were being set in an eighteen point line box: every heading, value
 * and label in the app came out with its letters sliced off. Clearing it hands
 * the spacing back to the font, which does scale.
 *
 * At the default size nothing changes, so the type scale keeps deciding the
 * rhythm of the app exactly as before.
 */
export function AppText({
  weight = 'normal',
  style,
  ...rest
}: TextProps & { weight?: AppTextWeight }) {
  const { fontScale } = useWindowDimensions()
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: FAMILIES[weight] },
        style,
        fontScale > 1 ? { lineHeight: undefined } : null,
      ]}
    />
  )
}
