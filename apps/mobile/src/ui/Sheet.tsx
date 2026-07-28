import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BackHandler, Keyboard, Modal, Pressable, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from './AppText'
import { useSheetScrollEventsHandlers } from './useSheetScrollEventsHandlers'

interface SheetProps {
  open: boolean
  onClose: () => void
  /** Native fark: metin parçaları AppText içinde verilmeli (çıplak string olmaz) */
  title: ReactNode
  children: ReactNode
  /** İçerikte kendi kaydıranı olan sheet'lerde (ör. tarih çarkı) kapat ;
      içerik sürüklemesi sheet'i kapatmaya çalışmasın; tutamaç çalışmaya devam eder */
  contentPanning?: boolean
  /** Verilirse sheet içerik boyuna göre değil ekranın bu oranında SABİT açılır
      (0–1). Yazdıkça içeriği değişen sheet'lerde zıplamayı önler. */
  heightRatio?: number
  /** Prevent every user-initiated dismissal while a critical operation is running. */
  enablePanDownToClose?: boolean
  /** Uses a fixed view instead of a scroll container when the content must stay in place. */
  scrollable?: boolean
  /**
   * Lifts the sheet above the tab bar.
   *
   * A sheet normally lives inside its tab screen, whose container stops at the
   * tab bar, so the bar stays lit under the dimmed backdrop and the sheet only
   * ever gets the height above it. For a long flow that is both distracting and
   * the reason the content runs out of room. Opt in and the sheet renders in a
   * modal host instead, over the whole screen.
   */
  overTabBar?: boolean
}

/**
 * Mobil alt sayfa; web ui/Sheet.tsx'in @gorhom/bottom-sheet sarmalayıcısı,
 * aynı props sözleşmesi. İçerik yüksekliğine oturur (dynamic sizing),
 * aşağı çekerek ya da karartıya dokunarak kapanır. Ekran kökünde, kaydırma
 * alanlarının DIŞINA yerleştirilir (absolute konumlanır).
 */
/** Long enough for the slide out to finish before the host goes away. */
const CLOSE_ANIMATION_MS = 320

export function Sheet({
  open,
  onClose,
  title,
  children,
  contentPanning = true,
  heightRatio,
  enablePanDownToClose = true,
  scrollable = true,
  overTabBar = false,
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
  const renderedContent = lastContent.current

  useEffect(() => {
    if (open) {
      ref.current?.expand()
      return
    }
    ref.current?.close()
    /* Every sheet that takes typing is done taking it once it closes. Leaving
       the keyboard up outlives the thing that asked for it and covers whatever
       comes next, which is how a celebration ended up behind a number pad. One
       place, so no sheet has to remember on its own. */
    Keyboard.dismiss()
  }, [open])

  /* The modal host has to outlive `open` by the length of the close animation:
     unmounting it the moment the flag flips would make the sheet disappear
     rather than slide away. */
  const [hosted, setHosted] = useState(open)
  useEffect(() => {
    if (open) {
      setHosted(true)
      return
    }
    const timer = setTimeout(() => setHosted(false), CLOSE_ANIMATION_MS)
    return () => clearTimeout(timer)
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

  const sheet = (
    <BottomSheet
      ref={ref}
      index={-1}
      enablePanDownToClose={enablePanDownToClose}
      enableContentPanningGesture={contentPanning}
      enableDynamicSizing={heightRatio === undefined}
      snapPoints={snapPoints}
      /* The sheet never reaches into the top safe area (notch, clock). This
         alone bounds it: a non-modal sheet's container is already the screen
         minus this inset, and gorhom caps dynamic content at the container. */
      topInset={insets.top + 8}
      /* maxDynamicContentSize is deliberately NOT set. It used to be measured
         from the WINDOW, but on a tab screen the container is shorter by the
         tab bar, so the cap sat above the container. `useAnimatedDetents`
         computes `containerHeight - min(content, cap)`, which then went
         NEGATIVE for tall content, and `overflow: hidden` ate the grab handle,
         the title row and the close button. Any sheet without an explicit
         heightRatio was one long body away from losing its own header. */
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
      {scrollable ? (
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          // Guards against the self-triggered scroll event loop that crashed the
          // UI runtime with a stack overflow; see useSheetScrollEventsHandlers.
          scrollEventsHandlersHook={useSheetScrollEventsHandlers}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 + insets.bottom }}
        >
          {renderedContent ? (
            <SheetContent
              content={renderedContent}
              dismissible={enablePanDownToClose}
              onClose={handleSheetClose}
            />
          ) : null}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView
          style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 20 + insets.bottom }}
        >
          {renderedContent ? (
            <SheetContent
              content={renderedContent}
              dismissible={enablePanDownToClose}
              onClose={handleSheetClose}
            />
          ) : null}
        </BottomSheetView>
      )}
    </BottomSheet>
  )

  if (!overTabBar) return sheet

  /* `transparent` keeps the sheet's own dimmed backdrop as the only scrim, and
     the gesture root has to live inside the modal or the pan and the backdrop
     tap stop reaching it on Android. The insets above were read outside this
     host, in the screen tree, so they are the real ones. */
  return (
    <Modal
      transparent
      visible={hosted}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleSheetClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>{sheet}</GestureHandlerRootView>
    </Modal>
  )
}

function SheetContent({
  content,
  dismissible,
  onClose,
}: {
  content: { title: ReactNode; children: ReactNode }
  dismissible: boolean
  onClose: () => void
}) {
  return (
    <>
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">{content.title}</View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !dismissible }}
          disabled={!dismissible}
          onPress={onClose}
          className={`rounded-full bg-muted px-3 py-1 ${dismissible ? '' : 'opacity-40'}`}
        >
          <AppText className="text-sm text-soft">Kapat</AppText>
        </Pressable>
      </View>
      {content.children}
    </>
  )
}
