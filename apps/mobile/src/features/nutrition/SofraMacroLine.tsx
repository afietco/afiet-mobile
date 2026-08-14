import { View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'
import type { SofraFood } from './sofra'
import { macroLine, sofraTotals, unknownNote } from './sofraMacros'
import { useCustomFoods } from './useCustomFoods'

/**
 * What a sofra adds up to, in one line wherever a sofra is shown.
 *
 * Written once and used in all four places a table appears (the Menüm list, the
 * editor, the sofra step of the add-food flow, and the offer in search), because
 * the same table showing two different totals is worse than showing none.
 *
 * The numbers are approximate and say so with a tilde: they come from the
 * catalogue's own per-measure figures, which exist to give a sense of size
 * rather than to be counted against. When part of the table could not be added
 * up, that is said too; a quiet omission makes a sofra look smaller than it is.
 */
export function SofraMacroLine({
  foods,
  /** Group icons under the numbers. Off where the row is already tight. */
  showGroups = false,
}: {
  foods: readonly SofraFood[]
  showGroups?: boolean
}) {
  const customFoods = useCustomFoods()
  const totals = sofraTotals(foods, customFoods)
  const line = macroLine(totals)
  const note = unknownNote(totals)

  if (!line && !note && totals.groups.length === 0) return null

  return (
    <View className="mt-1 gap-0.5">
      {line ? (
        <AppText numberOfLines={1} className="text-xs text-soft">
          {line}
        </AppText>
      ) : null}
      {note ? <AppText className="text-[11px] text-faint">{note}</AppText> : null}
      {showGroups && totals.groups.length > 0 ? (
        <View className="mt-0.5 flex-row flex-wrap items-center gap-1">
          {totals.groups.map((group) => (
            <GroupIcon key={group} group={group} size={14} />
          ))}
        </View>
      ) : null}
    </View>
  )
}
