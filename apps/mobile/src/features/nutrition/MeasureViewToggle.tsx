import * as Haptics from 'expo-haptics'
import { memo } from 'react'
import { Pressable, View } from 'react-native'
import { AppText } from '@/ui/AppText'
import type { MeasureView } from './measureViewPreference'

/**
 * The switch between the two languages of "Günün ölçüsü".
 *
 * A segmented pair rather than a switch or a menu: both options are readable
 * at a glance, which one is showing is never in doubt, and it sits in the card
 * header where a thumb reaches it without leaving the page. It carries the
 * selection language the rest of the app already uses (`ui/Chip`), so it reads
 * as part of the product and not as a developer control.
 *
 * Deliberately unanimated. The bodies it swaps fade in; making the pill travel
 * as well would put motion between a tap and the number someone wanted to see.
 */

const OPTIONS: { key: MeasureView; label: string; hint: string }[] = [
  { key: 'hand', label: 'El ölçüsü', hint: 'Günün ölçüsünü el diliyle gösterir' },
  { key: 'numbers', label: 'Sayılarla', hint: 'Günün ölçüsünü gram ve kalori olarak gösterir' },
]

export interface MeasureViewToggleProps {
  value: MeasureView
  onChange: (next: MeasureView) => void
}

export const MeasureViewToggle = memo(function MeasureViewToggle({
  value,
  onChange,
}: MeasureViewToggleProps) {
  return (
    <View className="flex-row rounded-full bg-muted p-0.5">
      {OPTIONS.map((option) => {
        const selected = option.key === value
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityHint={option.hint}
            /* The pill is 30pt tall so the header row stays calm; the slop
               brings the touch target back up to a comfortable thumb size. */
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            onPress={() => {
              if (selected) return
              void Haptics.selectionAsync()
              onChange(option.key)
            }}
            className={`rounded-full px-3 py-1.5 ${selected ? 'bg-emerald-600' : ''}`}
          >
            <AppText
              weight={selected ? 'bold' : 'semibold'}
              className={`text-xs ${selected ? 'text-white' : 'text-soft'}`}
            >
              {option.label}
            </AppText>
          </Pressable>
        )
      })}
    </View>
  )
})
