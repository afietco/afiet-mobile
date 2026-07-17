import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { isUsernameAvailable, setUsername } from '@/features/social/mockStore'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconCheck } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'

/**
 * Kullanıcı adı belirleme/değiştirme alt sayfası. Sosyal katmanın MOCK deposunu
 * kullanır (isUsernameAvailable + setUsername); backend gelince yalnız bu iki
 * çağrı gerçek API'ye bağlanır, arayüz aynı kalır. @handle küçük harf; format ve
 * müsaitlik canlı denetlenir, sakin tonda geri bildirilir (kırmızı/ceza yok).
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

  // Açılışta mevcut adla doldur (değiştir akışı), yoksa boş (belirle akışı).
  useEffect(() => {
    if (open) setValue(current ?? '')
  }, [open, current])

  // @ ve boşlukları at, küçük harfe indir; mockStore'un normalizasyonuyla aynı.
  const onChange = (raw: string) => {
    setValue(raw.replace(/[@\s]/g, '').toLowerCase())
  }

  const trimmed = value.trim()
  const available = isUsernameAvailable(trimmed)
  const unchanged = current != null && trimmed === current
  const showStatus = trimmed.length > 0

  const save = () => {
    if (!available || unchanged) return
    setUsername(trimmed)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onClose()
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
        style={{ borderColor: showStatus && available ? '#10b981' : t.line }}
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
        {showStatus && available ? (
          <IconCheck size={20} color="#10b981" strokeWidth={2.6} />
        ) : null}
      </View>

      {/* Canlı durum: müsaitse yeşil onay, değilse sakin uyarı; boşken format ipucu. */}
      {showStatus ? (
        available ? (
          <AppText className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
            {unchanged ? 'Şu anki kullanıcı adın.' : 'Bu ad uygun ✨'}
          </AppText>
        ) : (
          <AppText className="mt-2 text-sm text-soft">Bu ad alınmış ya da geçersiz.</AppText>
        )
      ) : (
        <AppText className="mt-2 text-xs text-faint">
          3-20 karakter · küçük harf, rakam, alt çizgi ve nokta.
        </AppText>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={save}
        disabled={!available || unchanged}
        className={`mt-5 items-center rounded-xl bg-emerald-600 py-3.5 ${
          !available || unchanged ? 'opacity-40' : ''
        }`}
      >
        <AppText weight="semibold" className="text-white">
          Kaydet
        </AppText>
      </Pressable>
    </Sheet>
  )
}
