import type { MealEntry } from '@afiet/core'
import { useCallback, useState, type ReactNode } from 'react'
import { ScrollView, View, type LayoutChangeEvent, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native'
import { AppText } from '@/ui/AppText'
import { GroupIcon, MealIcon } from '@/ui/appIcons'
import { groupsOf, mealSections, pageRows } from './balancePages'

/**
 * Three readings of the same day, side by side.
 *
 * The card used to be one fixed view: energy and three macro bars. That is the
 * most abstract thing the day can be turned into, and it was the only thing
 * offered, so "what did I actually eat today" was a question the balance card
 * could not answer at all. The other two readings were already on the screen
 * in pieces (the meal row, the entries inside a meal sheet) but never next to
 * the balance they explain.
 *
 * So the card swipes: the numbers, then the meals those numbers came from,
 * then the foods those meals were made of. Nothing is hidden behind the swipe
 * that was not visible before; the first page is exactly what the card always
 * showed, so the swipe is discovery rather than a relocation.
 *
 * Pages are laid out at the measured width of the card rather than at the
 * window width: the card sits inside the screen's horizontal padding, and a
 * page sized to the window would overhang it by exactly that much.
 *
 * Height is the other thing they share, and it is why the two list pages are
 * capped. A horizontal scroll view is as tall as its tallest child, so a day
 * with fifteen foods on it stretched every page to fit the longest one and
 * left the macro bars floating in a column of empty card. The lists are
 * summaries, not the log: what does not fit is counted rather than drawn, and
 * the whole record is a tap away in the meal itself.
 */


export interface BalancePage {
  key: string
  render: () => ReactNode
}

/**
 * One row per meal: icon, name, how many foods, and that meal's food groups.
 *
 * The count sits beside the name rather than under it. On a day with all four
 * meals logged, a second line each made this page four rows taller than the
 * macro page it shares a height with, and a horizontal pager is as tall as its
 * tallest child: the balance bars ended up floating in a column of empty card.
 */
export function MealsPage({ entries }: { entries: readonly MealEntry[] }) {
  const sections = mealSections(entries)

  if (sections.length === 0) {
    return (
      <AppText className="mt-4 text-sm text-faint">
        Bugün henüz bir öğün kaydetmedin. İlk besini eklediğinde öğünlerin burada
        sıralanır 🌱
      </AppText>
    )
  }

  return (
    <View className="mt-3">
      {sections.map((section, index) => (
        <View
          key={section.meal}
          className={`flex-row items-center gap-3 py-2 ${
            index > 0 ? 'border-t border-line/40' : ''
          }`}
        >
          <MealIcon meal={section.meal} size={22} />
          <View className="min-w-0 flex-1 flex-row items-baseline gap-2">
            <AppText weight="semibold" numberOfLines={1} className="shrink text-sm text-ink">
              {section.label}
            </AppText>
            <AppText numberOfLines={1} className="shrink-0 text-xs text-faint">
              {section.entries.length} besin
            </AppText>
          </View>
          <View className="shrink-0 flex-row items-center gap-1">
            {groupsOf(section.entries).map((group) => (
              <GroupIcon key={group} group={group} size={17} />
            ))}
          </View>
        </View>
      ))}
    </View>
  )
}

/** Gün içinde eklenen besinlerin listesi ve her birinin grup ikonları. */
export function FoodsPage({ entries }: { entries: readonly MealEntry[] }) {
  if (entries.length === 0) {
    return (
      <AppText className="mt-4 text-sm text-faint">
        Bugün eklediğin besinler burada tek tek görünür 🍲
      </AppText>
    )
  }

  /* One line per food, and only the first few. The group names that used to
     sit under each name are already said by the icons beside it, and they were
     the second line that made this page outgrow the card. */
  const { shown, rest } = pageRows(entries)

  return (
    <View className="mt-3">
      {shown.map((entry, index) => (
        <View
          key={entry.id ?? `${entry.createdAt}-${entry.foodName}`}
          className={`flex-row items-center gap-3 py-2 ${
            index > 0 ? 'border-t border-line/40' : ''
          }`}
        >
          <AppText numberOfLines={1} className="min-w-0 flex-1 text-sm text-ink">
            {entry.foodName}
          </AppText>
          <View className="shrink-0 flex-row items-center gap-1">
            {entry.groups.map((group) => (
              <GroupIcon key={group} group={group} size={17} />
            ))}
          </View>
        </View>
      ))}
      {rest > 0 ? (
        <AppText className="border-t border-line/40 pt-2 text-xs text-faint">
          ve {rest} besin daha. Hepsi öğünlerinin içinde.
        </AppText>
      ) : null}
    </View>
  )
}

/** Hangi sayfadasın; Afi notundaki şeridin aynısı. */
function Rail({ count, active, color }: { count: number; active: number; color: string }) {
  return (
    <View className="mt-3 flex-row items-center justify-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <View
          key={String(i)}
          style={{
            width: i === active ? 14 : 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: color,
            opacity: i === active ? 1 : 0.28,
          }}
        />
      ))}
    </View>
  )
}

/**
 * The pager itself.
 *
 * `pagingEnabled` alone is not enough here: it snaps to multiples of the
 * scroll view's own width, which is the card, and that is only right because
 * every page is laid out at exactly that width. So the width has to be known
 * before any page can be laid out, and it is only known after a layout pass.
 * The opening page carries that first frame on its own.
 */
export function BalancePager({
  pages,
  accent,
  label,
}: {
  pages: BalancePage[]
  accent: string
  /** Read to a screen reader in place of the swipe, which it cannot perform. */
  label: string
}) {
  const [width, setWidth] = useState(0)
  const [page, setPage] = useState(0)

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width)
  }, [])

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width <= 0) return
      const next = Math.round(event.nativeEvent.contentOffset.x / width)
      setPage((current) => (current === next ? current : next))
    },
    [width],
  )

  const shown = page < pages.length ? page : 0
  const first = pages[0]

  return (
    <View onLayout={onLayout}>
      {width <= 0 ? (
        /* The first frame, before the layout pass has measured anything. The
           opening page is drawn on its own rather than nothing at all: an
           empty box here would collapse the card to its padding and then snap
           to full height a frame later, which is the jump this avoids. */
        first?.render()
      ) : (
        <>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScroll}
            /* The card lives inside a vertical ScrollView, so the horizontal
               gesture has to win outright or every swipe reads as a scroll
               that wandered sideways. */
            directionalLockEnabled
            accessibilityLabel={label}
          >
            {pages.map((item) => (
              <View key={item.key} style={{ width }}>
                {item.render()}
              </View>
            ))}
          </ScrollView>
          {pages.length > 1 ? (
            <Rail count={pages.length} active={shown} color={accent} />
          ) : null}
        </>
      )}
    </View>
  )
}
