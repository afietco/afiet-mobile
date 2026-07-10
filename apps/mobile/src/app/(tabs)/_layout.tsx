import { Tabs } from 'expo-router'
import { tokens, useTheme } from '@/theme/useTheme'
import { IconBowl, IconCalendar, IconUser } from '@/ui/icons'

export default function TabsLayout() {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: t.faint,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line },
        tabBarLabelStyle: { fontFamily: 'Nunito_600SemiBold', fontSize: 11 },
      }}
    >
      {/* tint'ler yukarıda string verildi — ColorValue daralt (ikonlar string bekler) */}
      <Tabs.Screen
        name="(bugun)"
        options={{
          title: 'Bugün',
          tabBarIcon: ({ color, size }) => <IconBowl size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="gecmis"
        options={{
          title: 'Geçmiş',
          tabBarIcon: ({ color, size }) => <IconCalendar size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <IconUser size={size} color={color as string} />,
        }}
      />
    </Tabs>
  )
}
