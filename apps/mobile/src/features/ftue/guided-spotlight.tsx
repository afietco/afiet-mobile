import { useCallback, useEffect, useState, type RefObject } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, Mask, Rect } from 'react-native-svg'
import { useTabBarSpace } from '@/features/nav/tabBarSpace'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { AfiPose, type AfiPoseName } from '@/ui/maskot'
import { useTextScale } from '@/ui/textScale'

interface TargetRect {
  x: number
  y: number
  width: number
  height: number
}

interface GuidedSpotlightProps {
  stepKey: string
  targetRef?: RefObject<View | null>
  pose: AfiPoseName
  progress?: string
  title: string
  text: string
  actionLabel?: string
  onAction?: () => void
  /**
   * Ends the whole guide, from any step.
   *
   * A first run tour that covers the screen and has no way out is a trap by
   * construction: whatever else goes wrong, the person needs one reliable
   * sentence to tap. It is deliberately quiet rather than hidden, because the
   * moment somebody wants it is the moment they are already frustrated.
   */
  onDismiss?: () => void
}

const CUTOUT_MARGIN = 4
const CUTOUT_RADIUS = 20
/**
 * Only the height used for the very first frame, before the bubble has been
 * measured. Everything after that positions from the real measurement, because
 * the bubble's height is whatever the person's text size makes it: at the
 * larger accessibility sizes this card is more than twice as tall as this.
 */
const BUBBLE_HEIGHT_FIRST_GUESS = 184
/** Breathing room between the bubble, the highlighted element and the edges. */
const BUBBLE_GAP = 16

export function GuidedSpotlight({
  stepKey,
  targetRef,
  pose,
  progress,
  title,
  text,
  actionLabel,
  onAction,
  onDismiss,
}: GuidedSpotlightProps) {
  const { height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const tabBarSpace = useTabBarSpace()
  const { isDark } = useTheme()
  const [target, setTarget] = useState<TargetRect | null>(null)
  const [overlayOrigin, setOverlayOrigin] = useState({ x: 0, y: 0 })
  const overlayRef = useCallback((node: View | null) => {
    if (!node) return
    node.measureInWindow((x, y) => setOverlayOrigin({ x, y }))
  }, [])

  const measureTarget = useCallback(() => {
    if (!targetRef?.current) {
      setTarget(null)
      return
    }
    targetRef.current.measureInWindow((x, y, targetWidth, targetHeight) => {
      setTarget({
        x: Math.max(0, x - overlayOrigin.x - CUTOUT_MARGIN),
        y: Math.max(0, y - overlayOrigin.y - CUTOUT_MARGIN),
        width: targetWidth + CUTOUT_MARGIN * 2,
        height: targetHeight + CUTOUT_MARGIN * 2,
      })
    })
  }, [overlayOrigin.x, overlayOrigin.y, targetRef])

  /* The ordinary case: settle over the first few frames, and again whenever
     the overlay's own origin moves under it. */
  useEffect(() => {
    let frame: number | undefined
    let remainingMeasurements = 4
    const refreshTarget = () => {
      measureTarget()
      remainingMeasurements -= 1
      if (remainingMeasurements > 0) frame = requestAnimationFrame(refreshTarget)
    }
    frame = requestAnimationFrame(refreshTarget)
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame)
    }
  }, [measureTarget, stepKey])

  /**
   * And the case where those frames were not enough.
   *
   * `measureInWindow` answers through a callback that a view which is not laid
   * out yet never fires at all, so a highlight that arrives late is
   * indistinguishable from one that never arrives. Since the step now draws
   * nothing until it has found its target, waiting longer costs the person
   * nothing, where giving up after four frames used to cost them the step.
   */
  useEffect(() => {
    if (target) return
    let attempts = 0
    const timer = setInterval(() => {
      attempts += 1
      measureTarget()
      if (attempts >= 30) clearInterval(timer)
    }, 100)
    return () => clearInterval(timer)
  }, [measureTarget, stepKey, target])

  const dimColor = isDark ? 'rgba(2, 6, 23, 0.76)' : 'rgba(15, 23, 42, 0.58)'
  const targeted = targetRef !== undefined
  /* A step that cannot find the thing it points at has nothing useful to say
     and no business holding the page: it stands aside and lets the person get
     on with it. The guide notices on its own once the task is done. */
  const stepIsBlind = targeted && !target

  /**
   * The bubble is placed from its measured height, not from a guess.
   *
   * A guess is a promise about how tall the text will be, and text size is the
   * one thing the app does not decide. At the larger accessibility sizes the
   * bubble outgrew the constant and was laid out partly off the screen.
   *
   * When it will not fit above or below the highlight it is clamped to the
   * safe area and allowed to overlap. That stays usable: the bubble passes
   * touches through, so the highlighted element underneath is still tappable,
   * and the step can still be completed.
   */
  const [bubbleHeight, setBubbleHeight] = useState(BUBBLE_HEIGHT_FIRST_GUESS)
  const onBubbleLayout = useCallback((event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.height
    setBubbleHeight((current) => (Math.abs(current - measured) > 1 ? measured : current))
  }, [])

  const topLimit = insets.top + BUBBLE_GAP
  /* The tab bar floats over the screen rather than sitting below it, so the
     screen now reaches all the way down and the bubble has to stop itself
     where the layout used to stop it. */
  const bottomLimit = height - tabBarSpace - BUBBLE_GAP - bubbleHeight
  const bubbleTop = target
    ? Math.max(
        topLimit,
        Math.min(
          bottomLimit,
          target.y > height / 2
            ? target.y - bubbleHeight - BUBBLE_GAP
            : target.y + target.height + BUBBLE_GAP,
        ),
      )
    : topLimit

  /* The one line that makes the dim-with-nothing-on-it state unreachable. */
  if (stepIsBlind) return null

  return (
    <View
      ref={overlayRef}
      pointerEvents="box-none"
      onLayout={measureTarget}
      style={[StyleSheet.absoluteFill, styles.overlay]}
    >
      {targeted && target ? (
        <>
          <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Defs>
              <Mask id={`guide-cutout-${stepKey}`}>
                <Rect width="100%" height="100%" fill="#ffffff" />
                <Rect
                  x={target.x}
                  y={target.y}
                  width={target.width}
                  height={target.height}
                  rx={CUTOUT_RADIUS}
                  fill="#000000"
                />
              </Mask>
            </Defs>
            <Rect
              width="100%"
              height="100%"
              fill={dimColor}
              mask={`url(#guide-cutout-${stepKey})`}
            />
          </Svg>
          <BlockingArea style={{ left: 0, right: 0, top: 0, height: target.y }} />
          <BlockingArea
            style={{ left: 0, top: target.y, width: target.x, height: target.height }}
          />
          <BlockingArea
            style={{
              left: target.x + target.width,
              right: 0,
              top: target.y,
              height: target.height,
            }}
          />
          <BlockingArea
            style={{ left: 0, right: 0, top: target.y + target.height, bottom: 0 }}
          />
          <GuideBubble
            key={stepKey}
            top={bubbleTop}
            onLayout={onBubbleLayout}
            pose={pose}
            progress={progress}
            title={title}
            text={text}
            onDismiss={onDismiss}
          />
        </>
      ) : (
        <>
          <BlockingArea style={StyleSheet.absoluteFill} color={dimColor} />
          {!targeted ? (
            /**
             * Centred by layout, and scrollable the moment it stops fitting.
             *
             * This card used to be pinned to the middle by pushing it up half
             * of an assumed height (`translateY: -190`). At the larger text
             * sizes it grew past that assumption and its own button, the only
             * way forward, ended up below the bottom edge. Nothing else was
             * reachable either, because the guide covers the screen while it
             * runs, so the flow simply ended there.
             *
             * `flexGrow` with `justifyContent: center` keeps the card in the
             * middle whenever there is room and hands it to the scroll view
             * when there is not. It also drops the transform, which a layout
             * animation was overwriting on entry anyway.
             */
            /* Not animated in. The guide covers the screen while it runs, so
               a card that stays at an entering animation's hidden first frame
               is a dark screen with nothing on it and no way out: exactly the
               failure this flow already had once, from a different cause. */
            <View key={stepKey} style={StyleSheet.absoluteFill}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.centerScroll,
                  {
                    paddingTop: insets.top + 24,
                    paddingBottom: insets.bottom + 24,
                  },
                ]}
              >
                <View className="items-center rounded-3xl bg-surface p-6" style={styles.centerCard}>
                  <AfiPose
                    pose={pose}
                    motion={stepKey === 'complete' ? 'zafer' : 'selam'}
                    size={116}
                  />
                  {progress ? (
                    <AppText
                      weight="bold"
                      className="mt-2 text-xs text-emerald-600 dark:text-emerald-400"
                    >
                      {progress}
                    </AppText>
                  ) : null}
                  <AppText weight="extrabold" className="mt-2 text-center text-2xl text-ink">
                    {title}
                  </AppText>
                  <AppText className="mt-2 text-center leading-6 text-soft">{text}</AppText>
                  {actionLabel && onAction ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={onAction}
                      className="mt-5 min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3"
                    >
                      <AppText weight="bold" className="text-center text-white">
                        {actionLabel}
                      </AppText>
                    </Pressable>
                  ) : null}
                  <DismissButton onDismiss={onDismiss} />
                </View>
              </ScrollView>
            </View>
          ) : null}
        </>
      )}
    </View>
  )
}

function BlockingArea({ style, color }: { style: object; color?: string }) {
  return (
    <Pressable
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onPress={() => undefined}
      style={[styles.blockingArea, style, color ? { backgroundColor: color } : undefined]}
    />
  )
}

function GuideBubble({
  top,
  onLayout,
  pose,
  progress,
  title,
  text,
  onDismiss,
}: {
  top: number
  onLayout: (event: LayoutChangeEvent) => void
  onDismiss?: () => void
  pose: AfiPoseName
  progress?: string
  title: string
  text: string
}) {
  const { hidesDecoration } = useTextScale()

  return (
    <View
      /* The card itself still passes touches through, so the highlight beneath
         it stays tappable; only the way out actually takes one. */
      pointerEvents="box-none"
      onLayout={onLayout}
      style={[styles.bubble, { top }]}
    >
      <View
        pointerEvents="box-none"
        className="flex-row items-center gap-3 rounded-3xl bg-surface p-4"
      >
        {/* Afi steps aside once the text is large. Eighty-eight points beside a
            growing sentence squeezes it into a column a couple of words wide,
            and the line is what carries the step; the mascot is decoration the
            screen reader is not even told about. */}
        {hidesDecoration ? null : <AfiPose pose={pose} size={88} />}
        <View className="flex-1">
          {progress ? (
            <AppText weight="bold" className="text-xs text-emerald-600 dark:text-emerald-400">
              {progress}
            </AppText>
          ) : null}
          <AppText weight="extrabold" className="mt-0.5 text-lg text-ink">
            {title}
          </AppText>
          <AppText className="mt-1 text-sm leading-5 text-soft">{text}</AppText>
          <DismissButton onDismiss={onDismiss} align="left" />
        </View>
      </View>
    </View>
  )
}

/** The one thing every step of the guide agrees to offer. */
function DismissButton({
  onDismiss,
  align = 'center',
}: {
  onDismiss?: () => void
  align?: 'left' | 'center'
}) {
  if (!onDismiss) return null
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Rehberi kapat"
      onPress={onDismiss}
      hitSlop={10}
      className={`mt-2 py-1 active:opacity-60 ${align === 'center' ? 'self-center' : 'self-start'}`}
    >
      <AppText weight="semibold" className="text-xs text-faint">
        Şimdi değil
      </AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 100,
    elevation: 100,
  },
  blockingArea: {
    position: 'absolute',
  },
  bubble: {
    position: 'absolute',
    left: 16,
    right: 16,
    shadowColor: '#020617',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  centerScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerCard: {
    shadowColor: '#020617',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
  },
})
