import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HabitsSection } from '@/features/insights/habits-section'
import { HistorySection } from '@/features/insights/history-section'
import { OverviewSection } from '@/features/insights/overview-section'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChart } from '@/ui/icons'
import { ScreenHeader } from '@/ui/ScreenHeader'

const SECTIONS = [
  { key: 'overview', label: 'Bakış' },
  { key: 'habits', label: 'Alışkanlıklar' },
  { key: 'history', label: 'Geçmiş' },
] as const

type InformationSection = (typeof SECTIONS)[number]['key']

export default function BilgilerimScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const [section, setSection] = useState<InformationSection>('overview')
  const violet = isDark ? '#a78bfa' : '#7c3aed'

  return (
    <View className="flex-1 bg-canvas">
      <View
        style={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}
        className="bg-canvas"
      >
        <ScreenHeader
          title="Bilgilerim"
          subtitle="Bakış, alışkanlıklar ve geçmiş"
          icon={<IconChart size={24} color={violet} />}
        />

        <View
          accessibilityRole="tablist"
          className="mb-4 flex-row rounded-2xl bg-muted p-1"
        >
          {SECTIONS.map((item) => {
            const selected = section === item.key
            return (
              <Pressable
                key={item.key}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setSection(item.key)}
                className={`min-h-11 flex-1 items-center justify-center rounded-xl px-2 ${
                  selected ? 'bg-violet-600' : ''
                }`}
              >
                <AppText
                  weight="bold"
                  className={`text-sm ${selected ? 'text-white' : 'text-soft'}`}
                >
                  {item.label}
                </AppText>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View className="flex-1">
        {section === 'overview' ? <OverviewSection /> : null}
        {section === 'habits' ? <HabitsSection /> : null}
        {section === 'history' ? <HistorySection /> : null}
      </View>
    </View>
  )
}
