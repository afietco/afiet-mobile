import {
  LEAGUE_CUT_RATIO,
  LEAGUE_TABLE_SIZE,
  LEAGUE_TIERS,
  type LeagueTierKey,
} from '@afiet/core'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { tierColor } from '@/features/progress/TierRing'
import { XP_GUIDE_INTRO, xpGuideLines } from '@/features/progress/xpGuide'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight } from '@/ui/icons'
import { AfiPose, type AfiPoseName } from '@/ui/maskot'
import { ScreenHeader } from '@/ui/ScreenHeader'

/**
 * What the league is, on its own page.
 *
 * The ladder used to explain itself in fragments: a line about promotion under
 * the standings, a collapsed points dictionary at the bottom, and a card that
 * said what the tier was worth in Afi messages. That last one was the only
 * thing answering "why climb", and it left with the purse it was counting.
 *
 * This page is the answer put in one place and in order: what the five sofras
 * are, how the month moves you between them, what earns points, and the one
 * thing people actually worry about, which is what a bad month can take away.
 * The answer to that is nothing: the level and the title are yours, and the
 * league only ever counts the month it is in.
 *
 * Copy rules from docs/09: the ladder is stated as fact, never as a warning,
 * and nobody is told they are behind.
 */

/** Kademe pozları LeagueTierKey ile birebir eşleşir (bkz. lig/index.tsx). */
const tierPose = (key: LeagueTierKey): AfiPoseName => `lig-${key}`

/**
 * One line per tier: what it feels like to be at that table, never what it is
 * worth. A tier is a room, not a prize.
 */
const TIER_LINE: Record<LeagueTierKey, string> = {
  tuz: 'Her sofranın başladığı yer. Tuz olmadan hiçbir yemek tamamlanmaz.',
  nane: 'Kayıt tutmak alışkanlığa dönmüş. Sofran ferahlamış.',
  kekik: 'Artık dengeyi düşünüyorsun; tabağın kendi kokusu var.',
  sumak: 'Ritmin oturmuş. Az bir dokunuşla çok şey değişiyor.',
  safran: 'En üst sofra. Buraya sabırla gelinir, kimse acele ederek gelemez.',
}

export default function LeagueGuideScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const cut = Math.round(LEAGUE_CUT_RATIO * 100)
  const lines = xpGuideLines()

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
      >
        <ScreenHeader title="Lig nasıl işler?" subtitle="Beş sofra, bir ay" />

        <AppText className="mb-5 text-sm leading-6 text-soft">
          Lig bir yarış değil, bir sofra düzeni. Her ay {LEAGUE_TABLE_SIZE} kişilik bir
          sofraya oturuyorsun ve o ay tuttuğun kayıtlar seni bir üst sofraya taşıyabiliyor.
          Kaybedeceğin bir şey yok: seviyen ve unvanın sende kalır 🌿
        </AppText>

        {/* Merdivenin kendisi. Aşağıdan yukarı DEĞİL, yukarıdan aşağı okunur:
            listeye bakan önce nereye gidiyor olduğunu görsün.

            Her kart kendi baharat rengini taşır ve renk sıralamadaki seviye
            halkasının aynısıdır (TIER_COLOR): kişi sofrasını burada öğrenip
            listede tanıyor. Renk kademenin TEK ayrımı değil, maskot pozu da
            kendi baharatının formunda (26 Tem kararı). */}
        <SectionTitle>Beş sofra</SectionTitle>
        <View className="gap-1">
          {[...LEAGUE_TIERS].reverse().map((tier, index) => {
            const color = tierColor(tier.key, isDark)
            return (
              <View key={tier.key}>
                {index > 0 ? (
                  <View className="my-1 ml-6 flex-row items-center gap-1.5">
                    <View style={{ transform: [{ rotate: '-90deg' }] }}>
                      <IconChevronRight size={13} color={t.faint} />
                    </View>
                    <AppText className="text-[10px] text-faint">yükselirsen</AppText>
                  </View>
                ) : null}
                <View
                  className="flex-row items-center gap-3 overflow-hidden rounded-2xl bg-surface p-3"
                  style={{ borderLeftWidth: 4, borderLeftColor: color }}
                >
                  <View
                    className="h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${color}22` }}
                  >
                    <AfiPose pose={tierPose(tier.key)} size={52} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <AppText weight="extrabold" className="text-base" style={{ color }}>
                      {tier.emoji} {tier.label} Sofrası
                    </AppText>
                    <AppText className="mt-0.5 text-xs leading-5 text-soft">
                      {TIER_LINE[tier.key]}
                    </AppText>
                  </View>
                </View>
              </View>
            )
          })}
        </View>

        <SectionTitle>Ay nasıl geçer?</SectionTitle>
        <View className="gap-2">
          <Step
            step="1"
            title="Ayın 1'inde sofran kurulur"
            body={`Yakın puanlı ${LEAGUE_TABLE_SIZE} kişi aynı sofraya oturur. Herkes sıfırdan başlar.`}
          />
          <Step
            step="2"
            title="Ay boyunca puan toplarsın"
            body="Kayıt tuttukça, ölçünü girdikçe, görevlerini tamamladıkça puanın artar."
          />
          <Step
            step="3"
            title="Ay sonunda sofra değişir"
            body={`İlk %${cut} bir üst sofraya geçer, son %${cut} bir alt sofrada devam eder. Tuz sofrasından kimse aşağı inmez, çünkü altı yok.`}
          />
        </View>

        <SectionTitle>Puan nasıl kazanılır?</SectionTitle>
        <View className="rounded-2xl bg-surface p-4">
          <AppText className="mb-3 text-xs leading-5 text-faint">{XP_GUIDE_INTRO}</AppText>
          <View className="gap-2.5">
            {lines.map((line) => (
              <View key={line.source} className="flex-row items-baseline gap-3">
                <View className="min-w-0 flex-1">
                  <AppText className="text-sm text-ink">{line.label}</AppText>
                  <AppText className="text-xs text-faint">{line.limit}</AppText>
                </View>
                <AppText weight="bold" className="text-sm text-emerald-700 dark:text-emerald-300">
                  +{line.amount}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {/* İnsanların gerçekten merak ettiği kısım burası ve bilerek en sonda
            duruyor: yukarıdaki her şeyi okuduktan sonra akla gelen soru
            "kötü bir ay beni geriye atar mı" oluyor. */}
        <SectionTitle>Ne korunur, ne sıfırlanır?</SectionTitle>
        <View className="gap-2">
          <Fact
            tone="keep"
            title="Seviyen ve unvanın sende kalır"
            body="Bunlar ömür boyu birikir. Hangi sofrada olursan ol, geriye gitmezler."
          />
          <Fact
            tone="keep"
            title="Kayıtların, sofraların, menün sende kalır"
            body="Lig yalnız bir sıralama; verinin hiçbirine dokunmaz."
          />
          <Fact
            tone="reset"
            title="Ayın puanı her ay sıfırlanır"
            body="Yeni sofra kurulunca herkes aynı yerden başlar. Geçen ay ne yaptığın bu ayı belirlemez."
          />
        </View>

        <AppText className="mt-6 text-center text-xs leading-5 text-faint">
          Bir ay kayıt tutamadıysan bir şey kaybetmezsin; sofran seni bekler.
        </AppText>
      </ScrollView>
    </View>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <AppText weight="extrabold" className="mb-2 mt-6 text-base text-ink">
      {children}
    </AppText>
  )
}

function Step({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <View className="flex-row items-start gap-3 rounded-2xl bg-surface p-4">
      <View className="h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
        <AppText weight="extrabold" className="text-xs text-emerald-800 dark:text-emerald-200">
          {step}
        </AppText>
      </View>
      <View className="min-w-0 flex-1">
        <AppText weight="bold" className="text-sm text-ink">
          {title}
        </AppText>
        <AppText className="mt-0.5 text-xs leading-5 text-soft">{body}</AppText>
      </View>
    </View>
  )
}

function Fact({
  tone,
  title,
  body,
}: {
  tone: 'keep' | 'reset'
  title: string
  body: string
}) {
  return (
    <View className="flex-row items-start gap-3 rounded-2xl bg-surface p-4">
      <AppText className="text-lg">{tone === 'keep' ? '🌿' : '🔄'}</AppText>
      <View className="min-w-0 flex-1">
        <AppText weight="bold" className="text-sm text-ink">
          {title}
        </AppText>
        <AppText className="mt-0.5 text-xs leading-5 text-soft">{body}</AppText>
      </View>
    </View>
  )
}
