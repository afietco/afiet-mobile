import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { Dimensions, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from './AppText'

interface SheetProps {
  open: boolean
  onClose: () => void
  /** Native fark: metin parçaları AppText içinde verilmeli (çıplak string olmaz) */
  title: ReactNode
  children: ReactNode
}

/**
 * Mobil alt sayfa — web ui/Sheet.tsx'in @gorhom/bottom-sheet sarmalayıcısı,
 * aynı props sözleşmesi. İçerik yüksekliğine oturur (dynamic sizing),
 * aşağı çekerek ya da karartıya dokunarak kapanır. Ekran kökünde, kaydırma
 * alanlarının DIŞINA yerleştirilir (absolute konumlanır).
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const ref = useRef<BottomSheet>(null)
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']

  useEffect(() => {
    if (open) ref.current?.expand()
    else ref.current?.close()
  }, [open])

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={isDark ? 0.6 : 0.4}
      />
    ),
    [isDark],
  )

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      enablePanDownToClose
      enableDynamicSizing
      maxDynamicContentSize={Dimensions.get('window').height * 0.9}
      onClose={onClose}
      backgroundStyle={{
        backgroundColor: t.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
      handleIndicatorStyle={{ backgroundColor: t.line, width: 40, height: 6 }}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 + insets.bottom }}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">{title}</View>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            className="rounded-full bg-muted px-3 py-1"
          >
            <AppText className="text-sm text-soft">Kapat</AppText>
          </Pressable>
        </View>
        {children}
      </BottomSheetScrollView>
    </BottomSheet>
  )
}
