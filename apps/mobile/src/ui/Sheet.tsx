import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { usePathname } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Keyboard, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { track } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from './AppText'
import { ScreenMotion } from './motionGate'
import { Overlay } from './overlayHost'
import { useSheetScrollEventsHandlers } from './useSheetScrollEventsHandlers'

interface SheetProps {
  open: boolean
  onClose: () => void
  /** Telemetry identity; when set, opening and closing emit sheet_view /
      sheet_closed so funnels can see which popups people enter and abandon. */
  name?: string
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
}

/**
 * Mobil alt sayfa; web ui/Sheet.tsx'in @gorhom/bottom-sheet sarmalayıcısı,
 * aynı props sözleşmesi. İçerik yüksekliğine oturur (dynamic sizing),
 * aşağı çekerek ya da karartıya dokunarak kapanır.
 *
 * Where it is written no longer decides where it is drawn: every sheet renders
 * in the app's overlay layer (ui/overlayHost.tsx), above the tab bar and over
 * the whole window. That is not a per-sheet decision any more, because it never
 * was a real one: a sheet cut off at the tab bar, with a backdrop that leaves
 * the bar lit and tappable, is wrong on every screen that has a bar. Sheets
 * therefore get the whole window to size themselves against, and the bottom
 * safe-area padding below is theirs to spend rather than the bar's.
 */
export function Sheet({
  open,
  onClose,
  name,
  title,
  children,
  contentPanning = true,
  heightRatio,
  enablePanDownToClose = true,
  scrollable = true,
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

  /**
   * Whether the sheet has finished animating down, and therefore whether it is
   * still holding anything.
   *
   * The frozen content used to be kept for good: once a sheet had been opened,
   * its last contents stayed mounted for the rest of the session. A closed
   * sheet was therefore still running whatever lives inside it, and the
   * add-food step alone holds two debounce timers, a keyboard listener and a
   * live query. None of it is visible, all of it re-renders this component,
   * and re-rendering this component is exactly what reopens it (see the index
   * note below). Content is kept only while the closing animation is still
   * playing, which is all it was ever needed for.
   */
  const [settledShut, setSettledShut] = useState(true)
  if (open && settledShut) setSettledShut(false)
  const renderedContent = !open && settledShut ? null : lastContent.current

  /* Read inside a callback gorhom keeps for the life of the sheet. Written
     from an effect rather than during render: the callback only ever fires
     once an animation has settled, which is long after the commit. */
  const openRef = useRef(open)
  /**
   * A dismissal the person has performed and the parent has not answered yet.
   *
   * Dismissing runs ahead of `open`: the gesture settles, gorhom reports it,
   * and only then does the screen above set its state to false. For that one
   * gap `openRef` still says true while the sheet is on its way down, and
   * anything that reads it as "this should be up" would haul the sheet back
   * over the person who just put it away.
   */
  const dismissed = useRef(false)
  useEffect(() => {
    openRef.current = open
    /* Either answer ends the gap: false is the dismissal landing, true is a
       fresh request that supersedes it. */
    dismissed.current = false
  }, [open])

  // The cleanup covers both a regular close and an unmount-while-open, so
  // every sheet_view gets its sheet_closed with the seconds it was up.
  useEffect(() => {
    if (!name || !open) return
    const openedAt = Date.now()
    track('sheet_view', { sheet: name, ts: openedAt })
    return () => {
      track('sheet_closed', {
        sheet: name,
        duration_sec: Math.max(0, Math.round((Date.now() - openedAt) / 1000)),
      })
    }
  }, [name, open])

  /**
   * The sheet is told where to be, never ordered to move.
   *
   * `expand()` is refused outright while the sheet's layout is still being
   * measured, and nothing retries it, so an order given a moment too early is
   * simply lost and the sheet stays down for good. The `index` prop has no such
   * timing: gorhom reads it once the layout is ready and again whenever it
   * changes, so the sheet goes up as soon as it is able to. That matters more
   * than ever now that the sheet reaches its host a commit after it was asked
   * to open.
   */
  const index = open ? 0 : -1

  useEffect(() => {
    if (open) return
    hasRisen.current = false
    /* Closing is the one direction `index` cannot carry: gorhom resolves the
       prop through its detent list, which has no entry for -1, so the sheet
       would sit there open. `close()` is safe here in a way `expand()` was
       not, because a sheet that is being closed has already been measured. */
    ref.current?.close()
    /* Every sheet that takes typing is done taking it once it closes. Leaving
       the keyboard up outlives the thing that asked for it and covers whatever
       comes next, which is how a celebration ended up behind a number pad. One
       place, so no sheet has to remember on its own. */
    Keyboard.dismiss()
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
    dismissed.current = true
    onClose()
  }, [enablePanDownToClose, onClose, open])

  /**
   * A sheet drawn above the whole app has to be told when its screen is gone.
   *
   * It used to be clipped inside the screen that opened it, so a screen left
   * behind took its sheet with it. From the overlay layer it would instead stay
   * up over whatever came next. The dismissal guard is deliberately bypassed
   * here: the route has already changed, and a sheet stranded above a screen it
   * has nothing to do with is worse than one closed mid-task.
   */
  const pathname = usePathname()
  const previousPathname = useRef(pathname)
  useEffect(() => {
    const left = previousPathname.current !== pathname
    previousPathname.current = pathname
    if (left && open) onClose()
  }, [onClose, open, pathname])

  /**
   * Reported by the library, which is a much weaker claim.
   *
   * gorhom settles on a detent when it mounts and fires `onClose` if that
   * detent is the closed one, so a sheet that mounts shut reports a close
   * nobody asked for. Passing that on would tell the screen to close a sheet
   * it never opened. Only a close that follows the sheet actually rising is a
   * real one.
   */
  const handleLibraryClose = useCallback(() => {
    if (!hasRisen.current) return
    handleSheetClose()
  }, [handleSheetClose])

  /**
   * Where the sheet actually came to rest, which is not always where it was
   * told to be.
   *
   * `index={-1}` is not a detent. gorhom resolves the prop through its list,
   * finds nothing, and settles on the nearest entry instead, which is the open
   * one: a shut sheet re-resolves its way back up on any re-render. Closing is
   * done imperatively for that reason, but the imperative call only runs when
   * `open` changes, so nothing was watching for the sheet coming back up on
   * its own a second or two later. This is that watch, and it is the whole fix
   * for a popup that reopened itself after being dismissed.
   *
   * The other direction needs the same watch, and for the mirror-image reason.
   * Opening is carried by the `index` prop, which only acts when it CHANGES.
   * Dismiss a sheet and open it again before its closing slide has finished
   * and the prop goes 0 → -1 → 0 inside one animation: it ends where it
   * started, gorhom has nothing to react to, and the close it was already
   * playing runs to the end. The sheet is then sitting at the bottom of the
   * screen with `open` true and nobody left to tell it otherwise, which is a
   * popup that opens and stays stuck down there. Browsing one day after
   * another in Bilgilerim, or one group member after another, is exactly the
   * rhythm that produces it. `expand()` is safe from here in the way it is not
   * during a commit: this callback only fires once an animation has settled,
   * so the layout it needs has long been measured. It is guarded by
   * `dismissed`, without which the same line would undo every pan-to-close:
   * that settles here too, a moment before the screen above agrees.
   */
  const handleIndexChange = useCallback((settledIndex: number) => {
    if (settledIndex >= 0) {
      hasRisen.current = true
      if (!openRef.current) ref.current?.close()
      return
    }
    setSettledShut(true)
    if (openRef.current && !dismissed.current) ref.current?.expand()
  }, [])

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
      index={index}
      enablePanDownToClose={enablePanDownToClose}
      enableContentPanningGesture={contentPanning}
      enableDynamicSizing={heightRatio === undefined}
      snapPoints={snapPoints}
      /* The sheet never reaches into the top safe area (notch, clock). This
         alone bounds it: the overlay layer spans the window, so the container
         is the window minus this inset, and gorhom caps dynamic content at
         the container. */
      topInset={insets.top + 8}
      /* maxDynamicContentSize is deliberately NOT set. Measured from the
         window it used to sit ABOVE the container, because a sheet inside a
         tab screen had a container shorter by the tab bar.
         `useAnimatedDetents` computes `containerHeight - min(content, cap)`,
         which then went NEGATIVE for tall content, and `overflow: hidden`
         ate the grab handle, the title row and the close button. The two are
         the same measurement from the overlay layer, which makes the cap
         redundant rather than safe to re-add. */
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
          /* The library positions this view absolutely with only top, left and
             right set, so its height is whatever its children measure and
             `flex: 1` on it decides nothing: a child asking for the leftover
             space gets zero. Children here have to carry their own height. */
          style={{ paddingHorizontal: 20, paddingBottom: 20 + insets.bottom }}
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

  return (
    <Overlay active={open} onRequestClose={handleSheetClose}>
      {/* A closed sheet keeps its last content mounted, so Afi goes on
          breathing in a sheet nobody can see. That used to rest when you left
          the tab, because the sheet was inside the screen and inherited its
          gate; from the overlay layer there is no screen above it to inherit
          from. Being open is the truer question anyway: a closed sheet is
          invisible whether or not its screen is the one you are looking at. */}
      <ScreenMotion active={open}>{sheet}</ScreenMotion>
    </Overlay>
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
