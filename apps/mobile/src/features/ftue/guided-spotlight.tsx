import { useCallback, useEffect, useState, type RefObject } from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated'
import Svg, { Defs, Mask, Rect } from 'react-native-svg'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { AfiPose, type AfiPoseName } from '@/ui/maskot'

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
}

const CUTOUT_MARGIN = 4
const CUTOUT_RADIUS = 20
const CARD_HEIGHT_ESTIMATE = 184

export function GuidedSpotlight({
  stepKey,
  targetRef,
  pose,
  progress,
  title,
  text,
  actionLabel,
  onAction,
}: GuidedSpotlightProps) {
  const { height } = useWindowDimensions()
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

  const dimColor = isDark ? 'rgba(2, 6, 23, 0.76)' : 'rgba(15, 23, 42, 0.58)'
  const targeted = targetRef !== undefined
  const bubbleTop = target
    ? target.y > height / 2
      ? Math.max(16, target.y - CARD_HEIGHT_ESTIMATE - 16)
      : Math.min(height - CARD_HEIGHT_ESTIMATE - 16, target.y + target.height + 16)
    : 16

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
            pose={pose}
            progress={progress}
            title={title}
            text={text}
          />
        </>
      ) : (
        <>
          <BlockingArea style={StyleSheet.absoluteFill} color={dimColor} />
          {!targeted ? (
            <Animated.View
              key={stepKey}
              entering={FadeInDown.duration(240)}
              exiting={FadeOut.duration(140)}
              style={styles.centerCard}
            >
              <View className="items-center rounded-3xl bg-surface p-6">
                <AfiPose pose={pose} motion={stepKey === 'complete' ? 'zafer' : 'selam'} size={116} />
                {progress ? (
                  <AppText weight="bold" className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
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
                    className="mt-5 min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-600 px-5"
                  >
                    <AppText weight="bold" className="text-white">
                      {actionLabel}
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            </Animated.View>
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
  pose,
  progress,
  title,
  text,
}: {
  top: number
  pose: AfiPoseName
  progress?: string
  title: string
  text: string
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOut.duration(140)}
      pointerEvents="none"
      style={[styles.bubble, { top }]}
    >
      <View className="flex-row items-center gap-3 rounded-3xl bg-surface p-4">
        <AfiPose pose={pose} size={88} />
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
        </View>
      </View>
    </Animated.View>
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
  centerCard: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '50%',
    transform: [{ translateY: -190 }],
    shadowColor: '#020617',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
  },
})
