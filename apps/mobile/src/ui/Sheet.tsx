import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { BackHandler, Dimensions, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from './AppText'

interface SheetProps {
  open: boolean
  onClose: () => void
  /** Native fark: metin parçaları AppText içinde verilmeli (çıplak string olmaz) */
  title: ReactNode
  children: ReactNode
  /** İçerikte kendi kaydıranı olan sheet'lerde (ör. tarih çarkı) kapat —
      içerik sürüklemesi sheet'i kapatmaya çalışmasın; tutamaç çalışmaya devam eder */
  contentPanning?: boolean
  /** Verilirse sheet içerik boyuna göre değil ekranın bu oranında SABİT açılır
      (0–1). Yazdıkça içeriği değişen sheet'lerde zıplamayı önler. */
  heightRatio?: number
  /** Prevent every user-initiated dismissal while a critical operation is running. */
  enablePanDownToClose?: boolean
}

/**
 * Mobil alt sayfa — web ui/Sheet.tsx'in @gorhom/bottom-sheet sarmalayıcısı,
 * aynı props sözleşmesi. İçerik yüksekliğine oturur (dynamic sizing),
 * aşağı çekerek ya da karartıya dokunarak kapanır. Ekran kökünde, kaydırma
 * alanlarının DIŞINA yerleştirilir (absolute konumlanır).
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  contentPanning = true,
  heightRatio,
  enablePanDownToClose = true,
}: SheetProps) {
  const ref = useRef<BottomSheet>(null)
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const snapPoints = useMemo(
    () => (heightRatio ? [`${Math.round(heightRatio * 100)}%`] : undefined),
    [heightRatio],
  )
  // Kapanış animasyonu sırasında parent içeriği boşaltabilir (ör. seçili
  // besin null olur); web Sheet.tsx gibi son dolu içerik gösterilir.
  // İçerik yalnızca sheet BİR KEZ açıldıktan sonra mount edilir (başlangıçta
  // null): kapalı sheet zaten index -1'de olsa da @gorhom/bottom-sheet çocukları
  // hemen mount eder; içindeki autoFocus'lu bir TextInput (ör. Grup kur) böylece
  // ekran odağa gelir gelmez klavyeyi açıp sekme geçişlerinde klavyenin
  // belirip kaybolmasına yol açıyordu. Tembel mount bunu keser; autoFocus artık
  // yalnız sheet gerçekten açıldığında (içerik ilk kez mount olurken) çalışır.
  const lastContent = useRef<{ title: ReactNode; children: ReactNode } | null>(null)
  if (open) lastContent.current = { title, children }

  useEffect(() => {
    if (open) ref.current?.expand()
    else ref.current?.close()
  }, [open])

  const handleSheetClose = useCallback(() => {
    if (open && !enablePanDownToClose) {
      ref.current?.expand()
      return
    }
    onClose()
  }, [enablePanDownToClose, onClose, open])

  useEffect(() => {
    if (!open) return
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleSheetClose()
      return true
    })
    return () => subscription.remove()
  }, [handleSheetClose, open])

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={enablePanDownToClose ? 'close' : 'none'}
        opacity={isDark ? 0.6 : 0.4}
      />
    ),
    [enablePanDownToClose, isDark],
  )

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      enablePanDownToClose={enablePanDownToClose}
      enableContentPanningGesture={contentPanning}
      enableDynamicSizing={heightRatio === undefined}
      snapPoints={snapPoints}
      // Sheet hiçbir durumda üst güvenli alana (çentik/saat) taşmaz
      topInset={insets.top + 8}
      maxDynamicContentSize={Dimensions.get('window').height - insets.top - 8}
      onClose={handleSheetClose}
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
        {lastContent.current ? (
          <>
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">{lastContent.current.title}</View>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !enablePanDownToClose }}
                disabled={!enablePanDownToClose}
                onPress={handleSheetClose}
                className={`rounded-full bg-muted px-3 py-1 ${
                  enablePanDownToClose ? '' : 'opacity-40'
                }`}
              >
                <AppText className="text-sm text-soft">Kapat</AppText>
              </Pressable>
            </View>
            {lastContent.current.children}
          </>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheet>
  )
}
