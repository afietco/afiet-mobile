import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { AppText } from '@/ui/AppText'
import { IconX } from '@/ui/icons'
import { markFtueSeen, useFtueSeen, type FtueKey } from './ftueFlags'

interface FirstVisitIntroProps {
  ftueKey: FtueKey
  /** Degrade uçları [başlangıç, bitiş]; web'deki gradient sınıflarının karşılığı */
  colors: [string, string]
  icon: ReactNode
  title: string
  text: string
}

/** Mikro-FTUE: bir bölüme ilk girişte tek seferlik tanıtım kartı
    (web FirstVisitIntro.tsx portu) */
export function FirstVisitIntro({ ftueKey, colors, icon, title, text }: FirstVisitIntroProps) {
  const seen = useFtueSeen(ftueKey)
  if (seen) return null

  return (
    <View className="relative overflow-hidden rounded-2xl p-4">
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`fvi-${ftueKey}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#fvi-${ftueKey})`} />
      </Svg>
      <View
        pointerEvents="none"
        className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/15"
      />
      <View className="flex-row items-start gap-3">
        <View className="mt-0.5 shrink-0">{icon}</View>
        <View className="min-w-0 flex-1">
          <AppText weight="extrabold" className="text-white">
            {title}
          </AppText>
          <AppText className="mt-0.5 text-sm text-white/85">{text}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tanıtımı kapat"
          onPress={() => markFtueSeen(ftueKey)}
          className="-mr-1 -mt-1 h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15"
        >
          <IconX size={16} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  )
}
