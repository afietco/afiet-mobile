import { memo, useEffect, useState } from 'react'
import { View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'
import type { AfiCue } from './contract'
import { cueMotion } from './cues'

/**
 * Afi walking the user through the wizard.
 *
 * One mascot lives for the whole flow and changes stance as the steps do, so
 * it reads as a guide moving along with the user rather than a banner sitting
 * on top of them. Every stance change replays the pose's motion from its first
 * frame, which is what makes Afi look like it reacted.
 *
 * The figure stays decorative for screen readers because the line beside it
 * always carries the same meaning, and that line is a polite live region so
 * the change is announced once, not narrated twice.
 *
 * Memoised: this subtree is a few dozen SVG nodes, and a keystroke inside a
 * step must never repaint it.
 */

interface AfiStepGuideProps {
  cue: AfiCue
  size?: number
}

export const AfiStepGuide = memo(function AfiStepGuide({ cue, size = 76 }: AfiStepGuideProps) {
  const { pose, line } = cue
  const [beat, setBeat] = useState(0)

  useEffect(() => {
    setBeat((n) => n + 1)
  }, [pose])

  return (
    <View className="mb-4 flex-row items-center gap-1">
      <AfiPose pose={pose} motion={cueMotion(pose)} intro="giris" trigger={beat} size={size} />
      <View className="min-w-0 flex-1">
        {/* No entering animation on the bubble either. It disappeared with the
            step it belongs to, for the same reason: an animation that does not
            run leaves what it wraps at its hidden first frame. Afi still
            reacts, by changing stance. */}
        <View className="min-h-11 justify-center rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5">
          <AppText accessibilityLiveRegion="polite" className="text-sm leading-5 text-soft">
            {line}
          </AppText>
        </View>
      </View>
    </View>
  )
})
