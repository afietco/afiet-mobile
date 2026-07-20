import type { ReactNode } from 'react'
import { View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from './AppText'
import { IconChevronRight } from './icons'

interface CardHeaderProps {
  /** İkon rengi çağıran tarafta verilir (native'de currentColor yok) */
  icon: ReactNode
  /** Renkli yumuşak zemin sınıfları (bg + dark varyantı) */
  iconBg: string
  title: string
  /** Sağ taraf: durum metni/pill/butonlar */
  meta?: ReactNode
  /** Karta dokununca gidilecek yer varsa ok gösterilir */
  chevron?: boolean
}

/** Dashboard kartlarının ortak başlık satırı; web ui/CardHeader.tsx portu */
export function CardHeader({ icon, iconBg, title, meta, chevron = false }: CardHeaderProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <View className="flex-row items-center gap-2.5">
        <View className={`h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>{icon}</View>
        <AppText weight="bold" className="text-ink">
          {title}
        </AppText>
      </View>
      <View className="flex-row items-center gap-2">
        {meta}
        {chevron && <IconChevronRight size={20} color={t.faint} />}
      </View>
    </View>
  )
}
