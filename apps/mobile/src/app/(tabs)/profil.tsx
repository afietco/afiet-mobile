import Constants from 'expo-constants'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { THEME_KEY, tokens, useTheme, type ThemePref } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconContrast, IconMoon, IconSun } from '@/ui/icons'

// Web ProfilePage'deki THEME_OPTIONS aynası — etiket/ikon/sıra birebir
const THEME_OPTIONS: { key: ThemePref; label: string; Icon: typeof IconSun }[] = [
  { key: 'light', label: 'Açık', Icon: IconSun },
  { key: 'dark', label: 'Koyu', Icon: IconMoon },
  { key: 'system', label: 'Otomatik', Icon: IconContrast },
]

export default function ProfilScreen() {
  const insets = useSafeAreaInsets()
  const { pref, setPref, isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 16,
        paddingBottom: 32,
      }}
    >
      <AppText weight="extrabold" className="text-2xl text-ink">
        Profil
      </AppText>

      <View className="mt-4 rounded-2xl bg-surface p-5">
        <AppText weight="bold" className="mb-3 text-ink">
          Görünüm
        </AppText>
        <View className="flex-row overflow-hidden rounded-xl border border-line">
          {THEME_OPTIONS.map((o) => {
            const selected = pref === o.key
            return (
              <Pressable
                key={o.key}
                onPress={() => setPref(o.key)}
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 ${
                  selected ? 'bg-emerald-600' : 'bg-surface'
                }`}
              >
                <o.Icon size={18} color={selected ? '#ffffff' : t.soft} />
                <AppText
                  weight="semibold"
                  className={`text-sm ${selected ? 'text-white' : 'text-soft'}`}
                >
                  {o.label}
                </AppText>
              </Pressable>
            )
          })}
        </View>
        <AppText className="mt-3 text-xs text-faint">
          Tema tercihi cihazda saklanır ({THEME_KEY}).
        </AppText>
      </View>

      <AppText className="mt-6 text-center text-xs text-faint">
        afiet v{Constants.expoConfig?.version ?? '?'}
      </AppText>
    </ScrollView>
  )
}
