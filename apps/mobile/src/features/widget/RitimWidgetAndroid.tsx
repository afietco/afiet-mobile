import { FlexWidget, TextWidget } from 'react-native-android-widget'
import { isWidgetSnapshotCurrent } from './widgetFreshness'

/**
 * Android ana ekran widget'ı; tasarımın tek kaynağı afiet-brand/widget/
 * (kucuk-emerald.svg'nin RemoteViews çevirisi). Emoji yok; ritim noktaları
 * FlexWidget dairelerle, CTA saat bağlamlı, dokunuş derin bağlantıyla
 * Besin Ekle'yi açar. Veri AsyncStorage köprüsünden gelir (widgetBridge).
 */

export interface RitimWidgetState {
  weekStart: string
  savedAt: string
  dots: number[]
  done: number
  goal: number
  todayIndex: number
}

const MINT = '#a7f3d0'

function Dot({ filled, today }: { filled: boolean; today: boolean }) {
  return (
    <FlexWidget
      style={{
        width: today ? 13 : 12,
        height: today ? 13 : 12,
        borderRadius: 7,
        marginRight: 7,
        backgroundColor: filled ? '#ffffff' : today ? '#ffffff40' : '#ffffff38',
        borderWidth: today ? 2 : 0,
        borderColor: MINT,
      }}
    />
  )
}

export function RitimWidgetAndroid({
  state,
  mealKey,
  mealLabel,
}: {
  state: RitimWidgetState
  mealKey: string
  mealLabel: string
}) {
  const isCurrent = isWidgetSnapshotCurrent(state)
  const dots = isCurrent ? state.dots : [0, 0, 0, 0, 0, 0, 0]
  const todayIndex = isCurrent ? state.todayIndex : (new Date().getDay() + 6) % 7
  const label = isCurrent
    ? state.done >= state.goal
      ? 'Bu hafta afiyettesin'
      : `Bu hafta ${String(state.done)} afiyet günü`
    : "Ritmini tazelemek için afiet'i aç"
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: `afiet://ekle?ogun=${mealKey}` }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        borderRadius: 24,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        backgroundGradient: { from: '#10b981', to: '#047857', orientation: 'TL_BR' },
      }}
    >
      <TextWidget
        text="afiet"
        style={{ fontSize: 20, fontFamily: 'sans-serif-black', color: '#ffffff' }}
      />
      <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <TextWidget
          text={label}
          style={{ fontSize: 12, fontFamily: 'sans-serif-medium', color: MINT, marginBottom: 8 }}
        />
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          {dots.map((d, i) => (
            <Dot key={String(i)} filled={d === 1} today={i === todayIndex} />
          ))}
        </FlexWidget>
      </FlexWidget>
      <FlexWidget
        style={{
          width: 'match_parent',
          borderRadius: 16,
          backgroundColor: '#ffffff2e',
          paddingVertical: 9,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
        }}
      >
        <TextWidget
          text={`+  ${mealLabel}`}
          style={{ fontSize: 13, fontFamily: 'sans-serif-medium', color: '#ffffff' }}
        />
      </FlexWidget>
    </FlexWidget>
  )
}
