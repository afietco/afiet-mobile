import type { FC } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { THEME_KEY, tokens, useTheme, type ThemePref } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconCheck, IconContrast, IconMoon, IconPalette, IconSun, type IconProps } from '@/ui/icons'
import { ScreenHeader } from '@/ui/ScreenHeader'

/* Görünüm: hamburger menüden açılır. Tema seçimi (Açık / Koyu / Otomatik)
   profil.tsx'ten buraya taşındı. Varsayılan Otomatik (system): cihazın ayarını
   izler, "Önerilen" olarak işaretli. useTheme pref/setPref ile; tercih cihazda
   saklanır (fh:theme). Sade, tek kartlı, afiet tonu. */

const THEME_OPTIONS: { key: ThemePref; label: string; hint: string; Icon: FC<IconProps> }[] = [
  { key: 'system', label: 'Otomatik', hint: 'Cihazının ayarını izler', Icon: IconContrast },
  { key: 'light', label: 'Açık', hint: 'Her zaman aydınlık', Icon: IconSun },
  { key: 'dark', label: 'Koyu', hint: 'Her zaman koyu', Icon: IconMoon },
]

export default function GorunumScreen() {
  const insets = useSafeAreaInsets()
  const { pref, setPref, isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const magenta = isDark ? '#e879f9' : '#c026d3'

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <ScreenHeader
          title="Görünüm"
          subtitle="Tema ve renkler"
          icon={<IconPalette size={24} color={magenta} />}
        />

        <View className="rounded-2xl bg-surface p-5">
          <AppText weight="bold" className="text-ink">
            Tema
          </AppText>
          <AppText className="mt-1 text-sm text-soft">
            afiet'in aydınlık mı koyu mu görüneceğini seç. Otomatik, cihazının ayarını izler.
          </AppText>

          <View className="mt-4 gap-2">
            {THEME_OPTIONS.map((o) => {
              const selected = pref === o.key
              const recommended = o.key === 'system'
              return (
                <Pressable
                  key={o.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setPref(o.key)}
                  className={`flex-row items-center gap-3 rounded-xl border-2 px-4 py-3 ${
                    selected
                      ? 'border-fuchsia-500 bg-fuchsia-50 dark:border-fuchsia-400 dark:bg-fuchsia-950/40'
                      : 'border-line bg-surface'
                  }`}
                >
                  <o.Icon size={20} color={selected ? magenta : t.soft} />
                  <View className="min-w-0 flex-1">
                    <View className="flex-row items-center gap-2">
                      <AppText weight="semibold" className="text-ink">
                        {o.label}
                      </AppText>
                      {recommended ? (
                        <View className="rounded-full bg-fuchsia-100 px-2 py-0.5 dark:bg-fuchsia-900/50">
                          <AppText
                            weight="semibold"
                            className="text-[10px] uppercase text-fuchsia-700 dark:text-fuchsia-300"
                          >
                            Önerilen
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                    <AppText className="text-xs text-soft">{o.hint}</AppText>
                  </View>
                  {selected ? <IconCheck size={18} color={magenta} strokeWidth={2.6} /> : null}
                </Pressable>
              )
            })}
          </View>

          <AppText className="mt-4 text-xs text-faint">
            Tercihin cihazda saklanır ({THEME_KEY}).
          </AppText>
        </View>
      </ScrollView>
    </View>
  )
}
