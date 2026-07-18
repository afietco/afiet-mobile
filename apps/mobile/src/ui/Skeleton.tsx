import { useEffect, useRef } from 'react'
import { Animated, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'

/**
 * Yükleme iskeleti: içerik gelene dek yerini tutan, hafifçe nabız atan nötr
 * blok. Veri henüz gelmeden görünen boş ya da yanlış durumların ("flash")
 * yerine sakin bir bekleme sinyali verir (marka dili: ince animasyon, gürültü
 * yok). Renk temayla uyumlu, açık/koyu yüzeyde okunur. `color` ile üstünde
 * durduğu koyu zemine (ör. degrade kahraman kart) uyacak açık ton verilebilir.
 */
export function Skeleton({
  width = '100%',
  height = 14,
  radius = 7,
  color,
  style,
}: {
  width?: DimensionValue
  height?: DimensionValue
  radius?: number
  color?: string
  style?: StyleProp<ViewStyle>
}) {
  const { isDark } = useTheme()
  const base = color ?? tokens[isDark ? 'dark' : 'light'].line
  const pulse = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  return (
    <Animated.View
      accessibilityLabel="Yükleniyor"
      style={[{ width, height, borderRadius: radius, backgroundColor: base, opacity: pulse }, style]}
    />
  )
}
