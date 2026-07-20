import { useState } from 'react'
import { Pressable, View, type TextInputProps } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { IconEye, IconEyeOff } from '@/ui/icons'
import { TextField } from './TextField'

/** Password input with the standard visibility toggle kept inside the field. */
export function PasswordField({ className = '', ...props }: TextInputProps) {
  const [visible, setVisible] = useState(false)
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']

  return (
    <View className="relative">
      <TextField
        {...props}
        secureTextEntry={!visible}
        className={`pr-16 ${className}`}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}
        hitSlop={8}
        onPress={() => setVisible((current) => !current)}
        className="absolute bottom-0 right-1 top-0 w-14 items-center justify-center"
      >
        {visible ? <IconEyeOff size={22} color={t.soft} /> : <IconEye size={22} color={t.soft} />}
      </Pressable>
    </View>
  )
}
