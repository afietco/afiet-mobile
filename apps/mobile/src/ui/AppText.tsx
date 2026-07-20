import { Text, type TextProps } from 'react-native'

/** RN'de değişken font yok; her kalınlık ayrı Nunito dosyası (root layout yükler) */
const FAMILIES = {
  normal: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
} as const

export type AppTextWeight = keyof typeof FAMILIES

/** Nunito'lu Text; fontWeight yerine weight prop'u; className NativeWind'e geçer */
export function AppText({
  weight = 'normal',
  style,
  ...rest
}: TextProps & { weight?: AppTextWeight }) {
  return <Text {...rest} style={[{ fontFamily: FAMILIES[weight] }, style]} />
}
