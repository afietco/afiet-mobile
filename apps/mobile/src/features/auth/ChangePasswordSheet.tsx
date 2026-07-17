import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, View, type TextStyle } from 'react-native'
import { useAuth } from '@/features/auth/AuthContext'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconLock } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'

/**
 * Şifre değiştirme formu. İki alan (mevcut + yeni şifre), üçüncü "tekrar" alanı
 * yok - sürtünme düşük tutulur; 8 karakter kuralı Stack'e bırakılır (çifte
 * doğrulama yazılmaz), istemci yalnız boş alan gönderimini engeller. Başarıda
 * haptik onay verir, sheet kapanır ve satır altındaki onayı (onSuccess) tetikler.
 * Sheet içindeki alanlar BottomSheetTextInput (kök CLAUDE.md kuralı).
 */

interface ChangePasswordSheetProps {
  open: boolean
  onClose: () => void
  /** Şifre başarıyla değişince çağrılır (parent satır altında onay gösterir). */
  onSuccess: () => void
}

export function ChangePasswordSheet({ open, onClose, onSuccess }: ChangePasswordSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { changePassword } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Her açılışta bir kez tohumla (açık formdaki girdiyi ezme; kapanınca sıfırla).
  const seeded = useRef(false)
  useEffect(() => {
    if (!open) {
      seeded.current = false
      return
    }
    if (seeded.current) return
    seeded.current = true
    setCurrent('')
    setNext('')
    setBusy(false)
    setError(null)
  }, [open])

  // Boş alan gönderimini istemcide engelle; uzunluk kuralını Stack doğrular.
  const valid = current.length > 0 && next.length > 0

  const submit = async () => {
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    try {
      await changePassword(current, next)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onSuccess()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir şeyler ters gitti.')
      setBusy(false)
    }
  }

  const inputStyle: TextStyle = {
    borderWidth: 2,
    borderColor: t.line,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: t.ink,
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <>
          <IconLock size={20} color={isDark ? '#34d399' : '#059669'} />
          <AppText weight="bold" className="text-lg text-ink">
            Şifre değiştir
          </AppText>
        </>
      }
    >
      <View className="gap-4">
        <View>
          <AppText weight="semibold" className="mb-2 text-sm text-soft">
            Mevcut şifre
          </AppText>
          <BottomSheetTextInput
            value={current}
            onChangeText={(v) => {
              setCurrent(v)
              if (error) setError(null)
            }}
            placeholder="Şu anki şifren"
            placeholderTextColor={t.faint}
            secureTextEntry
            autoCapitalize="none"
            editable={!busy}
            style={inputStyle}
          />
        </View>

        <View>
          <AppText weight="semibold" className="mb-2 text-sm text-soft">
            Yeni şifre
          </AppText>
          <BottomSheetTextInput
            value={next}
            onChangeText={(v) => {
              setNext(v)
              if (error) setError(null)
            }}
            placeholder="Yeni şifren"
            placeholderTextColor={t.faint}
            secureTextEntry
            autoCapitalize="none"
            editable={!busy}
            returnKeyType="done"
            onSubmitEditing={() => void submit()}
            style={inputStyle}
          />
          <AppText className="mt-2 text-xs text-faint">En az 8 karakter</AppText>
        </View>

        {error ? (
          <AppText weight="semibold" className="text-rose-500">
            {error}
          </AppText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => void submit()}
          disabled={!valid || busy}
          className={`mt-1 flex-row items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 ${
            !valid || busy ? 'opacity-40' : ''
          }`}
        >
          {busy ? <ActivityIndicator color="white" /> : null}
          <AppText weight="semibold" className="text-white">
            {busy ? 'Güncelleniyor…' : 'Şifreyi güncelle'}
          </AppText>
        </Pressable>

        <AppText className="text-center text-xs text-faint">
          Güvenlik için diğer cihazlardaki oturumların kapatılır.
        </AppText>
      </View>
    </Sheet>
  )
}
