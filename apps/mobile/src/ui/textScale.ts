import { useWindowDimensions } from 'react-native'

/**
 * How the app answers the text size someone chose in iOS or Android settings.
 *
 * Text scaling is not a rare edge: on iOS it reaches 3.1x with the larger
 * accessibility sizes on, and people who need it keep it on for every app they
 * own. The rule here has two halves.
 *
 * Content always scales. Sentences, values, labels on controls: these carry
 * the meaning, and capping them would quietly withhold the setting the person
 * asked for. Layouts have to give way instead, which is why flows put their
 * body in a scroll view and their controls outside it.
 *
 * Decoration yields. A mascot, an illustration or a badge sitting beside text
 * is competing for the same width, and past a point it squeezes a sentence
 * into a column two words wide. Those step aside (`hidesDecoration`).
 *
 * The one exception is furniture whose height is fixed by the platform rather
 * than by us, the tab bar being the only case here. Its labels are capped, and
 * only because a tab bar that grows to three times its height is not a tab bar
 * any more; the destination is still reachable and still labelled.
 */

/** Beyond this, decorative imagery costs more width than it earns. */
const DECORATION_LIMIT = 1.3

/**
 * Cap for labels inside furniture of a fixed height. Deliberately generous:
 * it is a ceiling for a handful of words, not a policy for content.
 */
export const CHROME_MAX_FONT_SCALE = 1.4

export interface TextScale {
  /** The platform's current multiplier; 1 when the person has not changed it. */
  scale: number
  /** True once decoration beside text should step aside and give it the width. */
  hidesDecoration: boolean
}

export function useTextScale(): TextScale {
  const { fontScale } = useWindowDimensions()
  return { scale: fontScale, hidesDecoration: fontScale >= DECORATION_LIMIT }
}
