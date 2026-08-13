import { measureMeta, type FoodMeasure } from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import type { SofraFood } from '../sofra'
import type { SofraStepProps } from './contract'
import { nudgeQuantity, quantityRange } from './quantity'
import { tokens, useTheme } from '@/theme/useTheme'
import { trackTap } from '@/lib/track'
import { AppText } from '@/ui/AppText'
import { GroupIcon, MealIcon } from '@/ui/appIcons'
import { IconMinus, IconPlus, IconX } from '@/ui/icons'

/**
 * The sofra step: a saved table, before it lands.
 *
 * Tapping a sofra used to write all of it at once, at whatever amounts it was
 * saved with. That is the right answer on the morning the table really is the
 * same as always and the wrong one on every other morning: nobody eats the same
 * five things in the same five sizes forever, and the flow gave them no way to
 * say so short of adding the whole thing and then deleting from it.
 *
 * So the sofra now stops here first. Everything is included by default, because
 * that is what "sofram" means and because the common case should still be two
 * taps. What this screen adds is the ability to disagree with it: turn an amount
 * down, or take something off the table entirely.
 */

const numQty = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })

/** A sofra food with the amount this screen collected for it. */
interface Line extends SofraFood {
  /** Removed lines stay in the list, struck through, so removal is undoable. */
  included: boolean
}

export function SofraStep({ sofra, meal, saving, error, onAdd, onCue }: SofraStepProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']

  /* Seeded once from the sofra: this is a working copy for today, and the saved
     sofra itself is never touched from here. */
  const [lines, setLines] = useState<Line[]>(() =>
    sofra.foods.map((food) => ({ ...food, included: true })),
  )

  const cueRef = useRef(onCue)
  useEffect(() => {
    cueRef.current = onCue
  })

  const included = useMemo(() => lines.filter((line) => line.included), [lines])

  useEffect(() => {
    if (saving) return
    cueRef.current(
      included.length === 0
        ? { pose: 'merak', line: 'Hepsini çıkardın. Birini geri alalım mı?' }
        : { pose: 'kasik', line: 'Sofran hazır. Miktarları bugüne göre ayarlayabilirsin.' },
    )
  }, [included.length, saving])

  const nudge = useCallback((index: number, direction: 1 | -1) => {
    void Haptics.selectionAsync()
    setLines((current) =>
      current.map((line, i) =>
        i === index
          ? { ...line, quantity: nudgeQuantity(line.quantity, line.measure ?? 'porsiyon', direction) }
          : line,
      ),
    )
  }, [])

  const toggle = useCallback((index: number) => {
    void Haptics.selectionAsync()
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, included: !line.included } : line)),
    )
  }, [])

  const add = () => {
    if (saving || included.length === 0) return
    /* No property: how many foods landed is already `group_count` on the
       meal_logged this produces, and the tap guard keeps non-literals out. */
    trackTap('addfood_sofra_add')
    onAdd(included.map(({ included: _included, ...food }) => food))
  }

  return (
    <View>
      <View className="mb-1 flex-row items-center gap-2">
        <MealIcon meal={meal} size={18} />
        <AppText weight="bold" numberOfLines={2} className="min-w-0 flex-1 text-lg text-ink">
          {sofra.name}
        </AppText>
      </View>
      <AppText className="mb-4 text-sm text-soft">
        Miktarları ayarla, istemediğini çıkar.
      </AppText>

      <View className="overflow-hidden rounded-2xl border border-line bg-surface">
        {lines.map((line, index) => (
          <SofraLine
            key={`${line.name}-${String(index)}`}
            line={line}
            divider={index > 0}
            faint={t.faint}
            soft={t.soft}
            disabled={saving}
            onNudge={(direction) => nudge(index, direction)}
            onToggle={() => toggle(index)}
          />
        ))}
      </View>

      {error ? (
        <AppText
          selectable
          accessibilityLiveRegion="polite"
          className="mt-4 text-center text-sm text-soft"
        >
          {error}
        </AppText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sofrayı ekle, ${String(included.length)} besin`}
        accessibilityState={{ disabled: saving || included.length === 0, busy: saving }}
        disabled={saving || included.length === 0}
        onPress={add}
        className={`mt-5 min-h-11 items-center rounded-xl bg-emerald-600 py-3.5 ${
          saving || included.length === 0 ? 'opacity-40' : ''
        }`}
      >
        <AppText weight="semibold" className="text-white">
          {saving ? 'Kaydediliyor…' : `Sofrayı ekle (${String(included.length)} besin)`}
        </AppText>
      </Pressable>

      {included.length === 0 && !saving ? (
        <AppText className="mt-2 text-center text-xs leading-relaxed text-faint">
          Eklemek için sofrada en az bir besin kalsın.
        </AppText>
      ) : null}
    </View>
  )
}

const SofraLine = memo(function SofraLine({
  line,
  divider,
  faint,
  soft,
  disabled,
  onNudge,
  onToggle,
}: {
  line: Line
  divider: boolean
  faint: string
  soft: string
  disabled: boolean
  onNudge: (direction: 1 | -1) => void
  onToggle: () => void
}) {
  const measure: FoodMeasure = line.measure ?? 'porsiyon'
  const range = quantityRange(measure)
  const amount = `${numQty.format(line.quantity)} ${measureMeta(measure).label}`
  return (
    <View
      className={`flex-row items-center gap-2 px-3 py-2.5 ${divider ? 'border-t border-line/40' : ''} ${
        line.included ? '' : 'opacity-40'
      }`}
    >
      <View className="min-w-0 flex-1">
        <AppText weight="semibold" numberOfLines={1} className="text-ink">
          {line.name}
        </AppText>
        <View className="mt-0.5 flex-row items-center gap-1">
          {line.groups.map((group) => (
            <GroupIcon key={group} group={group} size={14} />
          ))}
        </View>
      </View>

      {line.included ? (
        <View className="shrink-0 flex-row items-center gap-1.5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${line.name} miktarını azalt`}
            accessibilityState={{ disabled: disabled || line.quantity <= range.min }}
            disabled={disabled || line.quantity <= range.min}
            onPress={() => onNudge(-1)}
            className={`h-9 w-9 items-center justify-center rounded-full bg-muted ${
              line.quantity <= range.min ? 'opacity-40' : ''
            }`}
          >
            <IconMinus size={16} color={soft} strokeWidth={2.4} />
          </Pressable>
          <AppText weight="bold" className="min-w-20 text-center text-sm text-ink">
            {amount}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${line.name} miktarını artır`}
            accessibilityState={{ disabled: disabled || line.quantity >= range.max }}
            disabled={disabled || line.quantity >= range.max}
            onPress={() => onNudge(1)}
            className={`h-9 w-9 items-center justify-center rounded-full bg-muted ${
              line.quantity >= range.max ? 'opacity-40' : ''
            }`}
          >
            <IconPlus size={16} color={soft} strokeWidth={2.4} />
          </Pressable>
        </View>
      ) : (
        <AppText className="shrink-0 text-xs text-faint">çıkarıldı</AppText>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          line.included ? `${line.name} besnini sofradan çıkar` : `${line.name} besnini geri al`
        }
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onToggle}
        className="-mr-1 h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-muted"
      >
        {line.included ? (
          <IconX size={16} color={faint} />
        ) : (
          <IconPlus size={16} color={faint} strokeWidth={2.4} />
        )}
      </Pressable>
    </View>
  )
})
