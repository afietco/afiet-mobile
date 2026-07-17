import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { ApiError } from '@/data/api/client'
import { isUsernameAvailable, setUsername } from '@/features/social/store'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconCheck } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'

/**
 * Kullanıcı adı belirleme/değiştirme alt sayfası. @handle küçük harf; biçim
 * (isUsernameAvailable) yazarken canlı denetlenir, benzersizlik ise kaydederken
 * gerçek PUT /profile ile: alınmışsa 409 gelir ve "alınmış" sakin tonda
 * gösterilir (kırmızı/ceza yok). Başarıda profil tablosu tazelenir.
 */

interface UsernameSheetProps {
  open: boolean
  onClose: () => void
  /** Mevcut kullanıcı adı; belirlenmemişse null (alan boş açılır). */
  current: string | null
}

export function UsernameSheet({ open, onClose, current }: UsernameSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  // Kaydederken sunucudan gelen sakin uyarı (alınmış / geçersiz); yazınca temizlenir.
  const [error, setError] = useState<string | null>(null)

  // Açılışta mevcut adla doldur (değiştir akışı), yoksa boş (belirle akışı).
  useEffect(() => {
    if (open) {
      setValue(current ?? '')
      setError(null)
    }
  }, [open, current])

  // @ ve boşlukları at, küçük harfe indir; store'un normalizasyonuyla aynı.
  const onChange = (raw: string) => {
    setValue(raw.replace(/[@\s]/g, '').toLowerCase())
    if (error) setError(null)
  }

  const trimmed = value.trim()
  const validFormat = isUsernameAvailable(trimmed)
  const unchanged = current != null && trimmed === current
  const showStatus = trimmed.length > 0

  const save = async () => {
    if (!validFormat || unchanged || saving) return
    setSaving(true)
    setError(null)
    try {
      await setUsername(trimmed)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onClose()
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setError('Bu ad alınmış, başka bir ad dene.')
      else if (e instanceof ApiError && e.status === 400) setError('Bu kullanıcı adı geçersiz.')
      else setError('Kaydedilemedi, birazdan tekrar dene.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      contentPanning={false}
      title={
        <AppText weight="bold" className="text-lg text-ink">
          {current ? 'Kullanıcı adını değiştir' : 'Kullanıcı adı belirle'}
        </AppText>
      }
    >
      <AppText className="mb-4 text-sm text-soft">
        Seni arkadaşların bu adla bulur. İstediğin zaman değiştirebilirsin.
      </AppText>

      <View
        className="flex-row items-center rounded-2xl border-2 bg-surface px-4"
        style={{ borderColor: showStatus && validFormat && !error ? '#10b981' : t.line }}
      >
        <AppText weight="bold" className="text-lg text-faint">
          @
        </AppText>
        <BottomSheetTextInput
          value={value}
          onChangeText={onChange}
          placeholder="kullaniciadi"
          placeholderTextColor={t.faint}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          maxLength={20}
          style={{
            flex: 1,
            paddingVertical: 14,
            paddingLeft: 4,
            fontFamily: 'Nunito_600SemiBold',
            fontSize: 18,
            color: t.ink,
          }}
        />
        {showStatus && validFormat && !error ? (
          <IconCheck size={20} color="#10b981" strokeWidth={2.6} />
        ) : null}
      </View>

      {/* Durum: kaydetme uyarısı (alınmış/geçersiz) öncelikli; yoksa biçim uygunsa
          yeşil onay, değilse ve boşken sakin format ipucu. */}
      {error ? (
        <AppText className="mt-2 text-sm text-soft">{error}</AppText>
      ) : showStatus && validFormat ? (
        <AppText className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
          {unchanged ? 'Şu anki kullanıcı adın.' : 'Bu ad uygun ✨'}
        </AppText>
      ) : (
        <AppText className="mt-2 text-xs text-faint">
          3-20 karakter · küçük harf, rakam, alt çizgi ve nokta.
        </AppText>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => void save()}
        disabled={!validFormat || unchanged || saving}
        className={`mt-5 items-center rounded-xl bg-emerald-600 py-3.5 ${
          !validFormat || unchanged || saving ? 'opacity-40' : ''
        }`}
      >
        <AppText weight="semibold" className="text-white">
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </AppText>
      </Pressable>
    </Sheet>
  )
}
