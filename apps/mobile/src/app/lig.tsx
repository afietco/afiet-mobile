import {
  keseTotalForTier,
  promotionGap,
  tierAbove,
  tierBelow,
  tierByKey,
  type LeagueTierKey,
} from '@afiet/core'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ApiLeagueRow } from '@/data/api/client'
import { useKese } from '@/features/kese/useKese'
import { LevelBadge } from '@/features/progress/LevelBadge'
import { MonthBreakdownCard } from '@/features/progress/MonthBreakdownCard'
import { XpGuideCard } from '@/features/progress/XpGuideCard'
import { mockMonthBreakdown } from '@/features/progress/monthBreakdownMock'
import { useLeagueResult } from '@/features/progress/useProgress'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { AfiPose, type AfiPoseName } from '@/ui/maskot'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { ScreenHeader } from '@/ui/ScreenHeader'

/**
 * League screen: one table of roughly 25 people in the same tier, scored by the
 * experience earned this month. The zone dividers are stated as facts, never as
 * warnings, and nobody is told they are behind (docs/09 invariant #2).
 */

const monthFmt = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' })

/**
 * Kademe pozları LeagueTierKey ile birebir eşleşir: her kademe kendi
 * baharatının formunu taşır, renk yalnız destektir (26 Tem kararı).
 */
const tierPose = (key: LeagueTierKey): AfiPoseName => `lig-${key}`

/** Mevsim adı sunucunun verdiği başlangıç gününden üretilir (yerel aritmetik). */
function seasonLabel(seasonStart: string): string {
  const [y, m, d] = seasonStart.split('-').map(Number)
  return monthFmt.format(new Date(y ?? 0, (m ?? 1) - 1, d ?? 1))
}

function daysLeft(seasonEnd: string): number {
  const [y, m, d] = seasonEnd.split('-').map(Number)
  const end = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1, 23, 59, 59)
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000))
}

/** Neutral divider that names what the band below or above means. */
function ZoneDivider({ label }: { label: string }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  return (
    <View className="my-1.5 flex-row items-center gap-2">
      <View className="h-px flex-1" style={{ backgroundColor: t.line }} />
      <AppText className="text-[10px] text-faint">{label}</AppText>
      <View className="h-px flex-1" style={{ backgroundColor: t.line }} />
    </View>
  )
}

function Row({ row }: { row: ApiLeagueRow }) {
  return (
    <View
      className={`flex-row items-center gap-3 rounded-xl px-2 py-2.5 ${
        row.isMe ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''
      }`}
    >
      <AppText
        weight={row.isMe ? 'extrabold' : 'semibold'}
        className="w-6 text-center text-sm text-soft"
      >
        {row.rank}
      </AppText>
      <AppText className="text-xl">{row.emoji ?? '🙂'}</AppText>
      <View className="min-w-0 flex-1">
        <AppText weight={row.isMe ? 'extrabold' : 'semibold'} numberOfLines={1} className="text-ink">
          {row.isMe ? 'Sen' : row.displayName || 'afiet üyesi'}
        </AppText>
        <View className="mt-0.5 flex-row">
          <LevelBadge level={row.level} />
        </View>
      </View>
      <AppText weight="bold" className="text-sm text-ink">
        {row.score}
      </AppText>
    </View>
  )
}

export default function LigScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { data: league, loading, error, retry } = useLeagueResult()
  const kese = useKese()

  if (loading || !league) return <PageSkeleton error={error} onRetry={retry} />

  const tier = tierByKey(league.tier as LeagueTierKey)
  // Zeminde alt, zirvede üst kademe yoktur; sunucu zaten o dilimleri 0 verir,
  // etiketler yalnız dilim varken kullanılır.
  const above = tierAbove(league.tier as LeagueTierKey)
  const below = tierBelow(league.tier as LeagueTierKey)
  const aboveLabel = above?.label ?? ''
  const belowLabel = below?.label ?? ''
  const size = league.rows.length
  const remaining = daysLeft(league.seasonEnd)
  /* What this tier is worth in messages, and what the one above would be.
     Only upward: naming the drop mid-month would be the warning docs/09
     invariant #6 rules out.

     Both come from the allowance the server already sent, with only the tier
     portion swapped, so the promise here is the number that would actually
     arrive rather than a second guess at it. */
  const keseHere = kese?.allowance.total ?? null
  const keseAbove = kese && above ? keseTotalForTier(kese.allowance, above.key) : null
  const gap = promotionGap(league.rows, league.promote, league.myRank, league.myScore)

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <ScreenHeader title="Lig" subtitle={seasonLabel(league.seasonStart)} />

        {!league.seated ? (
          // Henüz oturmamış olmak normal bir durumdur; hata gibi anlatılmaz.
          <View className="items-center rounded-2xl bg-surface p-8">
            {/* Zemin kademe: sofra kurulunca kişi buradan başlar. */}
            <AfiPose pose="lig-tuz" size={72} />
            <AppText weight="extrabold" className="mt-3 text-center text-lg text-ink">
              Sofran henüz kurulmadı
            </AppText>
            <AppText className="mt-2 max-w-xs text-center text-sm leading-6 text-soft">
              Her ayın 1'inde yeni sofralar kurulur. Kayıt tutmaya devam ettikçe
              bir sonraki sofrada yerini alırsın 🌱
            </AppText>
          </View>
        ) : (
          <>
            {/* Tier header: where I am this month and how long the window runs. */}
            <View className="items-center rounded-2xl bg-surface p-6">
              {/* Maskot kademenin baharatını taşıdığı için emoji tekrarı kalktı. */}
              <AfiPose pose={tierPose(tier.key)} size={104} />
              <AppText weight="extrabold" className="mt-2 text-xl text-ink">
                {tier.label} Sofrası
              </AppText>
              <AppText className="mt-1 text-sm text-soft">
                {league.myRank}. sıradasın · bu ay {league.myScore}
              </AppText>
              <AppText className="mt-2 text-xs text-faint">
                {remaining === 0
                  ? 'Bugün son gün'
                  : `${String(remaining)} gün sonra yeni sofra kurulur`}
              </AppText>

              {/* The answer to what the ladder is for, on the screen that asks it. */}
              {/* Bu blok ligin CEVABIDIR, dipnotu değil: merdiven neye yarıyor
                  sorusu burada, sıra numarasıyla aynı boyda duruyor. Yalnız
                  yukarı bakar; ay ortasında daralmayı anlatmak değişmez #6'nın
                  yasakladığı uyarı olurdu. */}
              {keseHere !== null ? (
                <View className="mt-5 w-full items-center rounded-2xl bg-canvas px-4 py-4">
                  <AppText className="text-2xl">🧺</AppText>
                  <AppText weight="extrabold" className="mt-1 text-center text-lg text-ink">
                    Haftada {keseHere} mesaj
                  </AppText>
                  <AppText className="mt-1 text-center text-xs leading-5 text-soft">
                    Bu sofranın Afi ile konuşma hakkın.
                    {keseAbove !== null
                      ? ` ${aboveLabel} sofrasında ${String(keseAbove)} olur.`
                      : ''}
                  </AppText>
                </View>
              ) : null}

              {/* Mesafe, yalnız yukarı yönde. Aşağı mesafe de aynı kolaylıkla
                  hesaplanır ve BİLEREK hesaplanmaz (değişmez #2). */}
              {gap !== null ? (
                <AppText className="mt-3 text-center text-xs leading-5 text-soft">
                  Yükselme bölgesine en az {gap} puan.
                </AppText>
              ) : league.promote > 0 && league.myRank <= league.promote ? (
                <AppText className="mt-3 text-center text-xs leading-5 text-emerald-700 dark:text-emerald-300">
                  Şu an yükselme bölgesindesin.
                </AppText>
              ) : null}
            </View>

            {/* The table itself. */}
            <View className="mt-3 rounded-2xl bg-surface p-3">
              {league.rows.map((row, index) => (
                <View key={row.userId}>
                  {row.rank === 1 && league.promote > 0 ? (
                    <ZoneDivider label={`${aboveLabel} sofrasına geçer`} />
                  ) : null}
                  {row.rank === league.promote + 1 && league.promote > 0 ? (
                    <ZoneDivider label="burada kalır" />
                  ) : null}
                  {league.demote > 0 && row.rank === size - league.demote + 1 ? (
                    <ZoneDivider label={`${belowLabel} sofrasında devam eder`} />
                  ) : null}
                  <Row row={row} />
                  {index < size - 1 ? (
                    <View className="h-px" style={{ backgroundColor: `${t.line}66` }} />
                  ) : null}
                </View>
              ))}
            </View>

            {/* Tablodan SONRA: tablo "neredeyim" sorusunu cevaplar, bunlar
                "bu nasıl işliyor" sorusunu. İkincisini üste koymak, gelen
                kişiyi aradığı şeyden uzaklaştırıyordu. */}
            <MonthBreakdownCard rows={mockMonthBreakdown(league.myScore)} total={league.myScore} />

            <View className="mt-3 rounded-2xl bg-surface p-4">
              <AppText className="text-xs leading-5 text-soft">
                {league.promote > 0
                  ? `Ay sonunda ilk ${String(league.promote)} kişi ${aboveLabel} sofrasına geçer. `
                  : 'Zirvedeki sofradasın, yukarısı yok. '}
                {league.demote > 0
                  ? `Son ${String(league.demote)} kişi ${belowLabel} sofrasında devam eder.`
                  : 'Buradan kimse aşağı inmez.'}
              </AppText>
              <AppText className="mt-2 text-xs leading-5 text-faint">
                Seviyen ve unvanın ay sonunda ne olursa olsun korunur; lig yalnız
                bu ayın puanını sayar.
              </AppText>
            </View>

            <XpGuideCard />

            <AppText className="mt-4 text-center text-xs text-faint">
              Sofran her ayın 1'inde yeniden kurulur.
            </AppText>
          </>
        )}
      </ScrollView>
    </View>
  )
}
