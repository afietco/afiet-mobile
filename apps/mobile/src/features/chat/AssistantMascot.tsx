import type { StyleProp, ViewStyle } from 'react-native'
import { AfiPose } from '@/ui/maskot'
import { DemiPose, SiniPose } from '@/ui/maskot/sofra'
import { ASSISTANTS } from './assistants'
import type { AssistantId } from './types'

/**
 * The face of one assistant, wherever it is asked for.
 *
 * The three used to be one mascot in three poses, because only Afi had been
 * drawn. Sini and Demi now have their own bodies (`ui/maskot/sofra`), and an
 * assistant called Sini wearing Afi's face was the sort of thing that reads as
 * a placeholder. Afi keeps a pose per screen, since he has twenty-four of them;
 * the other two have one each, so their pose is themselves.
 *
 * One component rather than a switch at every call site: the chat header, the
 * empty conversation and the quick-action menu all ask the same question.
 */
export function AssistantMascot({
  assistant,
  size,
  intro,
  style,
  accessibilityLabel,
}: {
  assistant: AssistantId
  size: number
  /** Only Afi plays an entrance; the other two simply breathe. */
  intro?: 'giris'
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}) {
  if (assistant === 'beslenme') {
    return <SiniPose size={size} style={style} accessibilityLabel={accessibilityLabel} />
  }
  if (assistant === 'destek') {
    return <DemiPose size={size} style={style} accessibilityLabel={accessibilityLabel} />
  }
  return (
    <AfiPose
      pose={ASSISTANTS.afi.pose}
      size={size}
      intro={intro}
      style={style}
      accessibilityLabel={accessibilityLabel}
    />
  )
}
