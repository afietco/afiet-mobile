import {
  promotionGap,
  standingsWindow,
  tierAbove,
  tierByKey,
  type LeagueTierKey,
} from '@afiet/core'
import { router } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LeagueRow, RowSeparator } from '@/features/progress/LeagueTable'
import { MonthBreakdownCard } from '@/features/progress/MonthBreakdownCard'
import { XpGuideCard } from '@/features/progress/XpGuideCard'
import { useLeagueResult } from '@/features/progress/useProgress'
import { trackTap } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconHelp } from '@/ui/icons'
import { AfiPose, type AfiPoseName } from '@/ui/maskot'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { ScreenHeader } from '@/ui/ScreenHeader'

/**
 * League screen: where I stand this month, and how the points are earned.
 *
 * The full table used to live here and took two thirds of the screen for rows
 * of mostly zeroes, which pushed everything that explains the ladder below the
 * fold. Only the neighbourhood is shown now (one above, me, one below); the
 * whole sofra has its own page.
 *
 * What the ladder is FOR used to be answered here, by a card that said how
 * many Afi messages this tier was worth. That answer moved out with the purse
 * it was counting, and the explainer behind the header button now carries it:
 * five tiers, the way between them, and what a month can and cannot take away.
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

  if (loading || !league) return <PageSkeleton error={error} onRetry={retry} />

  const tier = tierByKey(league.tier as LeagueTierKey)
  // Zirvede üst kademe yoktur; sunucu o dilimi zaten 0 verir.
  const above = tierAbove(league.tier as LeagueTierKey)
  const aboveLabel = above?.label ?? ''
  const remaining = daysLeft(league.seasonEnd)
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
        <ScreenHeader
          title="Lig"
          subtitle={seasonLabel(league.seasonStart)}
          action={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Lig nasıl işler"
              onPress={() => {
                trackTap('lig_guide_open')
                router.push('/lig/rehber')
              }}
              className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-80"
            >
              <IconHelp size={20} color={t.soft} />
            </Pressable>
          }
        />

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
                ekranın altına itiyordu.

                Blok artık tek bir düğme DEĞİL: her satır kendi kişisini açıyor,
                sofranın tamamı da altındaki bağlantıdan geçiliyor. İç içe iki
                dokunma hedefi olsaydı satıra basan sıralamaya giderdi. */}
            <View className="mt-3 rounded-2xl bg-surface p-3">
              {neighbours.map((row, index) => (
                <View key={row.userId}>
                  <LeagueRow row={row} tier={tier.key} />
                  {index < neighbours.length - 1 ? <RowSeparator /> : null}
                </View>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Sofranın tamamını gör, ${String(league.rows.length)} kişi`}
                onPress={() => {
                  trackTap('lig_open', { from: 'standings' })
                  router.push('/lig/siralama')
                }}
                className="mt-2 min-h-11 flex-row items-center justify-center gap-1 pt-1 active:opacity-70"
              >
                <AppText
                  weight="semibold"
                  className="text-xs text-emerald-700 dark:text-emerald-300"
                >
                  Sofranın tamamı ({league.rows.length} kişi)
                </AppText>
                <IconChevronRight size={14} color={isDark ? '#6ee7b7' : '#047857'} />
              </Pressable>
            </View>

            {/* Bunlar "bu nasıl işliyor" sorusunu cevaplıyor; sıralamadan sonra
                geliyorlar çünkü ekrana gelen önce "neredeyim" diye soruyor. */}
            <MonthBreakdownCard rows={league.myBreakdown} total={league.myScore} />

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
