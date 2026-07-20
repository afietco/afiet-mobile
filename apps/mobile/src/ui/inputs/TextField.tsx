import { useState } from 'react'
import { TextInput, type TextInputProps } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'

/** Custom metin alanı; büyük dokunma hedefi, odakta yeşil çerçeve
    (web ui/inputs/TextField.tsx portu; focus: yerine state ile). */
export function TextField({ className = '', style, onFocus, onBlur, ...props }: TextInputProps) {
  const [focused, setFocused] = useState(false)
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  return (
    <TextInput
      {...props}
      onFocus={(e) => {
        setFocused(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setFocused(false)
        onBlur?.(e)
      }}
      placeholderTextColor={t.faint}
      className={`w-full rounded-2xl border-2 bg-surface px-5 py-4 text-lg text-ink ${
        focused ? 'border-emerald-500' : 'border-line'
      } ${className}`}
      style={[{ fontFamily: 'Nunito_600SemiBold' }, style]}
    />
  )
}
