import {
  KESE_PREMIUM_BONUS,
  keseTotalForTier,
  promotionGap,
  standingsWindow,
  tierAbove,
  tierByKey,
  type LeagueTierKey,
} from '@afiet/core'
import { router } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useKese } from '@/features/kese/useKese'
import { LeagueRow, RowSeparator } from '@/features/progress/LeagueTable'
import { MonthBreakdownCard } from '@/features/progress/MonthBreakdownCard'
import { XpGuideCard } from '@/features/progress/XpGuideCard'
import { mockMonthBreakdown } from '@/features/progress/monthBreakdownMock'
import { useLeagueResult } from '@/features/progress/useProgress'
import { trackTap } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight } from '@/ui/icons'
import { AfiPose, type AfiPoseName } from '@/ui/maskot'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { ScreenHeader } from '@/ui/ScreenHeader'

/**
 * League screen: what this month's tier is worth, where I stand in it, and how
 * the points are earned.
 *
 * The full table used to live here and took two thirds of the screen for rows
 * of mostly zeroes, which pushed everything that explains the ladder below the
 * fold. Only the neighbourhood is shown now (one above, me, one below); the
 * whole sofra has its own page.
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

export default function LigScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { data: league, loading, error, retry } = useLeagueResult()
  const kese = useKese()

  if (loading || !league) return <PageSkeleton error={error} onRetry={retry} />

  const tier = tierByKey(league.tier as LeagueTierKey)
  // Zirvede üst kademe yoktur; sunucu o dilimi zaten 0 verir.
  const above = tierAbove(league.tier as LeagueTierKey)
  const aboveLabel = above?.label ?? ''
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
  const neighbours = standingsWindow(league.rows, league.myRank)

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
            <View className="rounded-2xl bg-surface p-4">
              {/* Kimlik satırı yatay: maskot lig kimliğinin parçası ve kalıyor,
                  ama dikey dururken kartın yarısını yiyordu. */}
              <View className="flex-row items-center gap-3">
                <AfiPose pose={tierPose(tier.key)} size={56} />
                <View className="min-w-0 flex-1">
                  <AppText weight="extrabold" className="text-lg text-ink">
                    {tier.label} Sofrası
                  </AppText>
                  <AppText className="mt-0.5 text-xs leading-5 text-soft">
                    {league.myRank}. sıradasın · bu ay {league.myScore} ·{' '}
                    {remaining === 0 ? 'bugün son gün' : `${String(remaining)} gün kaldı`}
                  </AppText>
                </View>
              </View>

              {/* Bu blok ligin CEVABIDIR, dipnotu değil: merdiven neye yarıyor
                  sorusu burada duruyor. Yalnız yukarı bakar; ay ortasında
                  daralmayı anlatmak değişmez #6'nın yasakladığı uyarı olurdu. */}
              {keseHere !== null ? (
                <View className="mt-4 flex-row items-center gap-3 rounded-2xl bg-canvas p-3.5">
                  <AppText className="text-2xl">🧺</AppText>
                  <View className="min-w-0 flex-1">
                    <AppText weight="extrabold" className="text-base text-ink">
                      Haftada {keseHere} mesaj
                    </AppText>
                    <AppText className="mt-0.5 text-xs leading-5 text-soft">
                      Bu sofranın Afi ile konuşma hakkın.
                      {keseAbove !== null
                        ? ` ${aboveLabel} sofrasında ${String(keseAbove)} olur.`
                        : ''}
                    </AppText>
                  </View>
                </View>
              ) : null}

              {/* TODO(kese): fiyat politikası park edildiği için teklif henüz bir
                  yere gitmiyor; premium ekranı açılınca EmptyKese'deki satırla
                  BİRLİKTE oraya bağlanacak (iki yüzey tek hedefe). */}
              {keseHere !== null ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="afiet premium hakkında bilgi al"
                  className="mt-2 flex-row items-center gap-3 rounded-2xl bg-canvas p-3.5 active:opacity-80"
                >
                  <AppText className="text-2xl">⭐</AppText>
                  <View className="min-w-0 flex-1">
                    <AppText weight="bold" className="text-sm text-ink">
                      afiet premium
                    </AppText>
                    <AppText className="mt-0.5 text-xs leading-5 text-soft">
                      Sofran ne olursa olsun her hafta {KESE_PREMIUM_BONUS} mesaj daha.
                    </AppText>
                  </View>
                  <IconChevronRight size={18} color={t.faint} />
                </Pressable>
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

            {/* Komşuluk: bir üst, ben, bir alt. Tamamı ayrı sayfada, çünkü
                yirmi beş satırın çoğu sıfır ve merdiveni anlatan her şeyi
                ekranın altına itiyordu. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Sofranın tamamını gör, ${String(league.rows.length)} kişi`}
              onPress={() => {
                trackTap('lig_open', { from: 'standings' })
                router.push('/lig/siralama')
              }}
              className="mt-3 rounded-2xl bg-surface p-3 active:opacity-90"
            >
              {neighbours.map((row, index) => (
                <View key={row.userId}>
                  <LeagueRow row={row} />
                  {index < neighbours.length - 1 ? <RowSeparator /> : null}
                </View>
              ))}
              <View className="mt-2 flex-row items-center justify-center gap-1 pt-1">
                <AppText
                  weight="semibold"
                  className="text-xs text-emerald-700 dark:text-emerald-300"
                >
                  Sofranın tamamı ({league.rows.length} kişi)
                </AppText>
                <IconChevronRight size={14} color={isDark ? '#6ee7b7' : '#047857'} />
              </View>
            </Pressable>

            {/* Bunlar "bu nasıl işliyor" sorusunu cevaplıyor; sıralamadan sonra
                geliyorlar çünkü ekrana gelen önce "neredeyim" diye soruyor. */}
            <MonthBreakdownCard rows={mockMonthBreakdown(league.myScore)} total={league.myScore} />

            <View className="mt-3 rounded-2xl bg-surface p-4">
              <AppText className="text-xs leading-5 text-soft">
                {league.promote > 0
                  ? `Ay sonunda ilk ${String(league.promote)} kişi ${aboveLabel} sofrasına geçer. `
                  : 'Zirvedeki sofradasın, yukarısı yok. '}
                {league.demote > 0
                  ? `Son ${String(league.demote)} kişi bir alt sofrada devam eder.`
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
