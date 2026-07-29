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
  /** Whether the sheet has reached an open detent since it was last asked to open. */
  const hasRisen = useRef(false)
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
      /* Inside a modal host the sheet does not exist yet at this point: the
         host mounts on the same state change, so expanding here would talk to
         a ref that is still null and leave a transparent modal covering the
         screen with a closed sheet behind it. The host's own onShow does it. */
      if (!overTabBar) ref.current?.expand()
      return
    }
    hasRisen.current = false
    ref.current?.close()
    /* Every sheet that takes typing is done taking it once it closes. Leaving
       the keyboard up outlives the thing that asked for it and covers whatever
       comes next, which is how a celebration ended up behind a number pad. One
       place, so no sheet has to remember on its own. */
    Keyboard.dismiss()
  }, [open, overTabBar])

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

  /* Asked for by a person: always honoured. Nothing here may depend on the
     sheet's internal state, because this is also the way out of a sheet that
     is in a bad way. */
  const handleSheetClose = useCallback(() => {
    if (open && !enablePanDownToClose) {
      ref.current?.expand()
      return
    }
    hasRisen.current = false
    onClose()
  }, [enablePanDownToClose, onClose, open])

  /**
   * Reported by the library, which is a much weaker claim.
   *
   * gorhom animates to the closed detent on mount and fires `onClose` when
   * that settles, so every mount reports a close nobody asked for. A sheet in
   * a modal host mounts each time it opens, which turns the report into an
   * instant self close: the sheet goes up, comes straight back down, and the
   * tap that opened it looks like it did nothing. Only a close that follows
   * the sheet actually rising is a real one.
   */
  const handleLibraryClose = useCallback(() => {
    if (!hasRisen.current) return
    handleSheetClose()
  }, [handleSheetClose])

  const handleIndexChange = useCallback((index: number) => {
    if (index >= 0) hasRisen.current = true
  }, [])

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
      onClose={handleLibraryClose}
      onChange={handleIndexChange}
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
          style={{
            flex: 1,
            /* The library positions this view absolutely with only top, left
               and right set, so its height is whatever its children measure
               and `flex: 1` on it decides nothing. A child asking for the
               leftover space then gets zero, which is how the body setup flow
               lost every question it was supposed to show. Pinning the bottom
               edge hands the view the sheet's own height, which is definite
               whenever a heightRatio fixes the detent. Dynamic sizing must
               keep the measured height: it sizes the sheet from this view. */
            ...(heightRatio === undefined ? null : { bottom: 0 }),
            paddingHorizontal: 20,
            paddingBottom: 20 + insets.bottom,
          }}
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
      /* Presented and laid out: only now does the sheet inside it exist. */
      onShow={() => ref.current?.expand()}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Safety net, deliberately behind the sheet. A transparent full screen
            host with a sheet that failed to rise is a trap: nothing is visible
            and nothing responds. This guarantees a tap always has somewhere to
            go, whatever the sheet is doing. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kapat"
          onPress={handleSheetClose}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
        {sheet}
      </GestureHandlerRootView>
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
