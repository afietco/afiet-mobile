import type { FoodGroup, HandMeasure, HandMeasureKey } from '@afiet/core'
import { View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'
import { AfiPose } from '@/ui/maskot'

/**
 * "Günün ölçüsü" in hand language: the default view of the Beslenme card.
 *
 * A hand belongs to the person holding it, so the measure already scales with
 * the body without a single gram being spoken. The counts and the four terms
 * (avuç içi, yumruk, kapalı avuç, başparmak) are the engine's, printed exactly
 * as it rounded them: as ranges, never as decimals. An estimate carrying a
 * double digit error margin has no business showing "3,5 avuç içi".
 *
 * The card header and the view toggle belong to `DailyMeasureCard`, which hosts
 * this body and the numbers body under one title. Everything below is content.
 */

/** What each hand measure is measuring, and which icon carries it. */
const ROWS: Record<HandMeasureKey, { group: FoodGroup; what: string }> = {
  protein: { group: 'protein', what: 'protein kaynağı' },
  vegetable: { group: 'sebze', what: 'sebze' },
  grain: { group: 'tahil', what: 'tahıl' },
  fat: { group: 'yag', what: 'yağ' },
}

export interface HandMeasuresProps {
  /** The four measures, in the order the engine returns them. */
  measures: readonly HandMeasure[]
  /**
   * The honesty anchor. It is the engine's own line rather than a constant
   * here, so on the day calibration replaces the estimate the sentence changes
   * with it instead of lingering as a claim that is no longer true.
   */
  note: string
}

export function HandMeasures({ measures, note }: HandMeasuresProps) {
  return (
    <View>
      <View className="gap-1">
        {measures.map((measure) => {
          const row = ROWS[measure.key]
          return (
            <View key={measure.key} className="flex-row items-center gap-3 py-1.5">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <GroupIcon group={row.group} size={20} />
              </View>
              <AppText className="flex-1 text-base text-soft">
                <AppText weight="extrabold" className="text-base text-ink">
                  {measure.text}
                </AppText>{' '}
                {row.what}
              </AppText>
            </View>
          )
        })}
      </View>

      {/* The honesty anchor is the card's promise, not a disclaimer: the
          formula is a starting guess and says so out loud, in Afi's voice. The
          rhythm pose is the one that matches the second half of the sentence,
          which is about records accumulating rather than about a shortfall. */}
      <View className="mt-3 flex-row items-center gap-2 rounded-xl bg-muted/60 p-3">
        <AfiPose pose="ritim" size={56} />
        <AppText className="flex-1 text-sm leading-5 text-soft">{note}</AppText>
      </View>
    </View>
  )
}
