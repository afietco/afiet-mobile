import * as Haptics from 'expo-haptics'
import { Pressable, ScrollView, Text } from 'react-native'

/** Grup logosu seçenekleri (profil avatarlarından ayrı, sofra/aile temalı). */
export const GROUP_EMOJIS = ['👨‍👩‍👧‍👦', '🏠', '🍲', '🥗', '🧡', '🌱', '💪', '🏃', '🍎', '☀️', '⭐', '🫶']

/** Grup logosu seçimi; yatay, tek satır emoji şeridi (sheet'lerde kompakt
    dursun diye ızgara yerine kaydırmalı şerit; kurma ve düzenlemede ortak). */
export function GroupEmojiRow({
  value,
  onChange,
}: {
  value: string | null
  onChange: (emoji: string) => void
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {GROUP_EMOJIS.map((e) => {
        const selected = value === e
        return (
          <Pressable
            key={e}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              void Haptics.selectionAsync()
              onChange(e)
            }}
            className={`h-12 w-12 items-center justify-center rounded-2xl border-2 ${
              selected
                ? 'border-emerald-500 bg-emerald-100 dark:border-emerald-400 dark:bg-emerald-900/60'
                : 'border-transparent bg-muted'
            }`}
            style={selected ? { transform: [{ scale: 1.06 }] } : undefined}
          >
            <Text style={{ fontSize: 24, lineHeight: 30 }}>{e}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
