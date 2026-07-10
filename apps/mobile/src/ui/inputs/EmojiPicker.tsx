import { Pressable, Text, View } from 'react-native'

/** Web ui/inputs/EmojiPicker.tsx ile aynı liste — birlikte güncelle */
export const AVATAR_EMOJIS = ['😀', '😎', '🦁', '🐻', '🦊', '🐼', '🦉', '🐬', '🌸', '⚡', '🔥', '⭐']

const COLS = 4
const ROWS = Array.from({ length: Math.ceil(AVATAR_EMOJIS.length / COLS) }, (_, r) =>
  AVATAR_EMOJIS.slice(r * COLS, r * COLS + COLS),
)

interface EmojiPickerProps {
  value: string | null
  onChange: (emoji: string) => void
}

/** Avatar emoji ızgarası — onboarding ve profil düzenlemede ortak.
    Kare hücreler flex satırlarıyla kurulur; seçim çerçevesi border ile
    (RN'de ring yok), yer kaymasın diye seçimsizken şeffaf border. */
export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <View className="gap-3">
      {ROWS.map((row) => (
        <View key={row[0]} className="flex-row gap-3">
          {row.map((e) => {
            const selected = value === e
            return (
              <Pressable
                key={e}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onChange(e)}
                className={`aspect-square flex-1 items-center justify-center rounded-2xl border-2 ${
                  selected
                    ? 'border-emerald-500 bg-emerald-100 dark:border-emerald-400 dark:bg-emerald-900/60'
                    : 'border-transparent bg-surface'
                }`}
                style={selected ? { transform: [{ scale: 1.05 }] } : undefined}
              >
                <Text style={{ fontSize: 34, lineHeight: 42 }}>{e}</Text>
              </Pressable>
            )
          })}
        </View>
      ))}
    </View>
  )
}
