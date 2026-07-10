import type { ReactNode } from 'react'
import { Pressable } from 'react-native'
import { AppText } from './AppText'

interface ChipProps {
  label: string
  /** Aktif chip'te ikon rengini çağıran verir (color="#ffffff") */
  icon?: ReactNode
  active?: boolean
  onPress?: () => void
}

/** Seçim pill'i — web ui/Chip.tsx portu */
export function Chip({ label, icon, active, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
        active ? 'border-emerald-600 bg-emerald-600' : 'border-line bg-surface'
      }`}
    >
      {icon}
      <AppText className={`text-sm ${active ? 'text-white' : 'text-soft'}`}>{label}</AppText>
    </Pressable>
  )
}
