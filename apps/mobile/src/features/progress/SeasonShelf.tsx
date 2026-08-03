/**
 * The seasons you have played, kept.
 *
 * Designed in docs/11 as the "kademe rozet rafı" and never built, which left
 * the league with nothing that survives the month: a tier can narrow, and
 * until now nothing recorded that you had once sat higher.
 *
 * Deliberately NEUTRAL. Each badge says only which sofra a month ended in;
 * there is no promoted/relegated language and no arrows, because a shelf that
 * marks descents is a record of failures and docs/09 invariant #2 rules that
 * out. What "birikim asla azalmaz" means here is simply that the past is not
 * erased: a Kekik month stays a Kekik month even after a drop to Nane.
 *
 * Newest first, because the question people ask a shelf is "where am I lately".
 */
import { tierByKey, type LeagueTierKey } from '@afiet/core'
import { ScrollView, View } from 'react-native'
import { AppText } from '@/ui/AppText'

export interface SeasonBadge {
  /** Local YYYY-MM-DD; the first of the month the season ran. */
  seasonStart: string
  tier: LeagueTierKey
}

const monthFmt = new Intl.DateTimeFormat('tr-TR', { month: 'short' })
const yearFmt = new Intl.DateTimeFormat('tr-TR', { year: 'numeric' })

function monthLabel(seasonStart: string): { month: string; year: string } {
  const [y, m, d] = seasonStart.split('-').map(Number)
  const date = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1)
  return { month: monthFmt.format(date), year: yearFmt.format(date) }
}

function Badge({ badge, showYear }: { badge: SeasonBadge; showYear: boolean }) {
  const tier = tierByKey(badge.tier)
  const { month, year } = monthLabel(badge.seasonStart)

  return (
    <View
      accessibilityLabel={`${month} ${year}: ${tier.label} sofrası`}
      className="w-[74px] items-center rounded-2xl bg-canvas px-2 py-3"
    >
      <AppText className="text-2xl">{tier.emoji}</AppText>
      <AppText weight="bold" className="mt-1 text-xs text-ink" numberOfLines={1}>
        {tier.label}
      </AppText>
      <AppText className="text-[10px] text-faint" numberOfLines={1}>
        {showYear ? `${month} ${year}` : month}
      </AppText>
    </View>
  )
}

export function SeasonShelf({ badges }: { badges: SeasonBadge[] }) {
  if (badges.length === 0) {
    return (
      <View className="mt-2 rounded-xl bg-canvas p-3.5">
        <AppText className="text-xs leading-5 text-faint">
          Mevsim rafın ay sonunda dolmaya başlar: her ay, o ayı bitirdiğin sofra
          burada kalır.
        </AppText>
      </View>
    )
  }

  /* Yıl yalnız birden çok yıl varsa yazılır; tek yılda her rozette tekrar
     etmesi rafı okunmaz yapıyordu. */
  const years = new Set(badges.map((badge) => badge.seasonStart.slice(0, 4)))
  const showYear = years.size > 1

  return (
    <View className="mt-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {badges.map((badge) => (
          <Badge key={badge.seasonStart} badge={badge} showYear={showYear} />
        ))}
      </ScrollView>
    </View>
  )
}
